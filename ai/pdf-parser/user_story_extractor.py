#!/usr/bin/env python3
"""
PDF User Story Extractor with AI
Extrai User Stories de PDFs usando Ollama + Llama2
"""

import json
import re
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import PyPDF2
import ollama
from dataclasses import dataclass, asdict

@dataclass
class UserStory:
    """Estrutura de uma User Story"""
    id: str
    title: str
    description: str
    story_points: int
    acceptance_criteria: List[str]
    priority: str = "Medium"
    epic: str = ""
    tags: List[str] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []

class PDFUserStoryExtractor:
    """Extrator de User Stories de PDFs usando IA"""
    
    def __init__(self, model_name: str = "llama2"):
        self.model_name = model_name
        self.setup_ollama()
    
    def setup_ollama(self):
        """Configura e verifica se Ollama está rodando"""
        try:
            # Testa se o modelo está disponível
            models = ollama.list()
            available_models = [model['name'] for model in models['models']]
            
            if self.model_name not in available_models:
                print(f"⚠️  Modelo {self.model_name} não encontrado.")
                print(f"📥 Modelos disponíveis: {', '.join(available_models)}")
                print(f"💡 Execute: ollama pull {self.model_name}")
                sys.exit(1)
                
            print(f"✅ Ollama configurado com modelo: {self.model_name}")
            
        except Exception as e:
            print(f"❌ Erro ao conectar com Ollama: {e}")
            print("💡 Certifique-se de que Ollama está rodando: ollama serve")
            sys.exit(1)
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extrai texto de um arquivo PDF"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n"
                
                print(f"📄 Texto extraído: {len(text)} caracteres")
                return text
                
        except Exception as e:
            print(f"❌ Erro ao ler PDF: {e}")
            return ""
    
    def create_extraction_prompt(self, text: str) -> str:
        """Cria prompt otimizado para extrair User Stories"""
        return f"""
Analise o seguinte texto e extraia todas as User Stories encontradas.
Retorne APENAS um JSON válido, sem texto adicional.

Formato esperado:
{{
    "user_stories": [
        {{
            "id": "US001",
            "title": "Título da User Story",
            "description": "Como [papel], quero [funcionalidade], para [benefício]",
            "story_points": 5,
            "acceptance_criteria": [
                "Critério 1",
                "Critério 2"
            ],
            "priority": "High|Medium|Low",
            "epic": "Nome do Epic",
            "tags": ["tag1", "tag2"]
        }}
    ]
}}

Texto para análise:
{text}

IMPORTANTE:
- Se não encontrar User Stories, retorne: {{"user_stories": []}}
- Mantenha IDs sequenciais (US001, US002, etc.)
- Story points devem ser números inteiros (1, 2, 3, 5, 8, 13, 21)
- Se não encontrar story points, estime baseado na complexidade
- Se não encontrar acceptance criteria, gere critérios lógicos
- Prioridade: High (crítico), Medium (importante), Low (desejável)
"""
    
    def extract_user_stories_with_ai(self, text: str) -> List[UserStory]:
        """Extrai User Stories usando IA"""
        try:
            prompt = self.create_extraction_prompt(text)
            
            print("🤖 Processando com IA...")
            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    'temperature': 0.1,  # Baixa criatividade para mais precisão
                    'top_p': 0.9,
                    'max_tokens': 4000
                }
            )
            
            ai_response = response['response'].strip()
            print(f"📝 Resposta da IA: {len(ai_response)} caracteres")
            
            # Tenta extrair JSON da resposta
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = ai_response
            
            # Parse do JSON
            data = json.loads(json_str)
            user_stories = []
            
            for story_data in data.get('user_stories', []):
                try:
                    story = UserStory(
                        id=story_data.get('id', ''),
                        title=story_data.get('title', ''),
                        description=story_data.get('description', ''),
                        story_points=story_data.get('story_points', 0),
                        acceptance_criteria=story_data.get('acceptance_criteria', []),
                        priority=story_data.get('priority', 'Medium'),
                        epic=story_data.get('epic', ''),
                        tags=story_data.get('tags', [])
                    )
                    user_stories.append(story)
                except Exception as e:
                    print(f"⚠️  Erro ao processar story: {e}")
                    continue
            
            print(f"✅ {len(user_stories)} User Stories extraídas")
            return user_stories
            
        except json.JSONDecodeError as e:
            print(f"❌ Erro ao fazer parse do JSON: {e}")
            print(f"📝 Resposta da IA: {ai_response[:500]}...")
            return []
        except Exception as e:
            print(f"❌ Erro na extração com IA: {e}")
            return []
    
    def process_pdf(self, pdf_path: str) -> List[UserStory]:
        """Processa um PDF completo"""
        print(f"📄 Processando PDF: {pdf_path}")
        
        # 1. Extrair texto
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            return []
        
        # 2. Extrair User Stories com IA
        user_stories = self.extract_user_stories_with_ai(text)
        
        return user_stories
    
    def save_to_json(self, user_stories: List[UserStory], output_path: str):
        """Salva User Stories em JSON"""
        try:
            data = {
                "extracted_at": str(Path().cwd()),
                "total_stories": len(user_stories),
                "user_stories": [asdict(story) for story in user_stories]
            }
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Salvo em: {output_path}")
            
        except Exception as e:
            print(f"❌ Erro ao salvar: {e}")

def main():
    """Função principal"""
    if len(sys.argv) != 2:
        print("📖 Uso: python user_story_extractor.py <caminho_do_pdf>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not Path(pdf_path).exists():
        print(f"❌ Arquivo não encontrado: {pdf_path}")
        sys.exit(1)
    
    # Criar extrator
    extractor = PDFUserStoryExtractor()
    
    # Processar PDF
    user_stories = extractor.process_pdf(pdf_path)
    
    if user_stories:
        # Salvar resultado
        output_path = f"extracted_user_stories_{Path(pdf_path).stem}.json"
        extractor.save_to_json(user_stories, output_path)
        
        # Mostrar resumo
        print("\n📊 RESUMO:")
        print(f"Total de User Stories: {len(user_stories)}")
        print(f"Total de Story Points: {sum(story.story_points for story in user_stories)}")
        
        print("\n📋 USER STORIES EXTRAÍDAS:")
        for story in user_stories:
            print(f"  {story.id}: {story.title} ({story.story_points} pts)")
    else:
        print("❌ Nenhuma User Story encontrada")

if __name__ == "__main__":
    main()
