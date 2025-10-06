#!/usr/bin/env python3
"""
Setup Script para AI PDF Parser
Configura o ambiente necessário para extração de User Stories
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command: str, description: str):
    """Executa um comando e mostra o resultado"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Erro: {e}")
        print(f"📝 Saída: {e.stdout}")
        print(f"📝 Erro: {e.stderr}")
        return False

def check_python_version():
    """Verifica se a versão do Python é adequada"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python {version.major}.{version.minor} não é suportado")
        print("💡 Requer Python 3.8 ou superior")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
    return True

def install_python_packages():
    """Instala pacotes Python necessários"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ Arquivo requirements.txt não encontrado")
        return False
    
    return run_command(
        f"pip install -r {requirements_file}",
        "Instalando pacotes Python"
    )

def check_ollama():
    """Verifica se Ollama está instalado"""
    try:
        result = subprocess.run("ollama --version", shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Ollama instalado: {result.stdout.strip()}")
            return True
    except:
        pass
    
    print("❌ Ollama não encontrado")
    return False

def install_ollama():
    """Instala Ollama"""
    print("📥 Instalando Ollama...")
    print("💡 Acesse: https://ollama.ai/download")
    print("💡 Ou execute:")
    print("   curl -fsSL https://ollama.ai/install.sh | sh")
    
    # Para Windows
    if os.name == 'nt':
        print("💡 Windows: Baixe o instalador em https://ollama.ai/download")
    
    return False

def setup_ollama_model():
    """Configura o modelo Llama2"""
    print("🤖 Configurando modelo Llama2...")
    
    # Verifica se o modelo já existe
    try:
        result = subprocess.run("ollama list", shell=True, capture_output=True, text=True)
        if "llama2" in result.stdout:
            print("✅ Modelo llama2 já instalado")
            return True
    except:
        pass
    
    # Instala o modelo
    return run_command(
        "ollama pull llama2",
        "Baixando modelo llama2"
    )

def test_extraction():
    """Testa a extração com um exemplo"""
    print("🧪 Testando extração...")
    
    # Cria um arquivo de teste
    test_pdf_path = Path(__file__).parent / "test_sample.pdf"
    
    if not test_pdf_path.exists():
        print("⚠️  Arquivo de teste não encontrado")
        print("💡 Coloque um PDF de exemplo em test_sample.pdf")
        return True
    
    # Testa o extrator
    try:
        from user_story_extractor import PDFUserStoryExtractor
        
        extractor = PDFUserStoryExtractor()
        user_stories = extractor.process_pdf(str(test_pdf_path))
        
        if user_stories:
            print(f"✅ Teste bem-sucedido! {len(user_stories)} User Stories extraídas")
        else:
            print("⚠️  Nenhuma User Story encontrada no teste")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

def main():
    """Função principal de setup"""
    print("🚀 Configurando AI PDF Parser para User Stories")
    print("=" * 50)
    
    # 1. Verificar Python
    if not check_python_version():
        return False
    
    # 2. Instalar pacotes Python
    if not install_python_packages():
        return False
    
    # 3. Verificar/Instalar Ollama
    if not check_ollama():
        if not install_ollama():
            print("❌ Setup incompleto - Ollama necessário")
            return False
    
    # 4. Configurar modelo
    if not setup_ollama_model():
        print("❌ Setup incompleto - Modelo necessário")
        return False
    
    # 5. Testar extração
    test_extraction()
    
    print("\n🎉 Setup concluído!")
    print("💡 Para usar:")
    print("   python user_story_extractor.py <arquivo.pdf>")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
