'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  Wand2,
  Eye
} from 'lucide-react';
import { UserStoryParser, ParsedUserStory } from '@/services/userStoryParser';

interface TextPasteModalProps {
  onParse: (parsedStory: ParsedUserStory) => void;
  onClose: () => void;
}

export function TextPasteModal({ onParse, onClose }: TextPasteModalProps) {
  const [text, setText] = useState('');
  const [parsedStory, setParsedStory] = useState<ParsedUserStory | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleTextChange = (value: string) => {
    setText(value);
    
    if (value.trim()) {
      const isValidFormat = UserStoryParser.isValidFormat(value);
      setIsValid(isValidFormat);
      
      if (isValidFormat) {
        const parsed = UserStoryParser.parse(value);
        setParsedStory(parsed);
      } else {
        setParsedStory(null);
      }
    } else {
      setIsValid(false);
      setParsedStory(null);
    }
  };

  const handleParse = () => {
    if (parsedStory) {
      onParse(parsedStory);
      onClose();
    }
  };

  const handlePasteExample = () => {
    const exampleText = `US08 - Configuração de Ambiente Containerizado
Prioridade: Alta | Story Points: 5
Como desenvolvedor,
Quero um ambiente containerizado para todas as camadas,
Para garantir consistência e facilitar o processo de deploy.
Critérios de Aceitação:
- [ ] Docker Compose com PostgreSQL, Node.js e React
- [ ] Variáveis de ambiente configuráveis
- [ ] Scripts de inicialização de dados incluídos
- [ ] Documentação de setup`;

    setText(exampleText);
    handleTextChange(exampleText);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wand2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Parser de User Story</h2>
        </div>
        <p className="text-muted-foreground">
          Cole o texto da User Story e deixe a IA extrair as informações automaticamente
        </p>
      </div>

      {/* Área de texto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Texto da User Story
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="storyText">Cole o texto aqui:</Label>
            <Textarea
              id="storyText"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Cole aqui o texto da User Story no formato padrão..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePasteExample}
            >
              <Copy className="h-4 w-4 mr-2" />
              Exemplo
            </Button>
            
            {isValid && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Ocultar' : 'Ver'} Preview
              </Button>
            )}
          </div>

          {/* Status de validação */}
          {text.trim() && (
            <div className="flex items-center gap-2">
              {isValid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">
                    ✅ Formato reconhecido! Pronto para criar.
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600">
                    ⚠️ Formato não reconhecido. Verifique se está no padrão correto.
                  </span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && parsedStory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview da User Story
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Título</Label>
                <p className="text-sm font-medium">{parsedStory.title}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Prioridade</Label>
                <Badge 
                  variant={parsedStory.priority === 'High' ? 'destructive' : 
                          parsedStory.priority === 'Medium' ? 'default' : 'secondary'}
                >
                  {parsedStory.priority}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Story Points</Label>
                <Badge variant="outline">{parsedStory.storyPoints}</Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                <div className="flex gap-1 flex-wrap">
                  {parsedStory.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
              <p className="text-sm whitespace-pre-line bg-muted p-3 rounded-md">
                {parsedStory.description}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Critérios de Aceitação ({parsedStory.acceptanceCriteria.length})
              </Label>
              <ul className="text-sm space-y-1 mt-2">
                {parsedStory.acceptanceCriteria.map((criteria, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Formato esperado:</strong><br />
          • Título: US08 - Nome da User Story<br />
          • Prioridade: Alta | Story Points: 5<br />
          • Descrição: Como [papel], Quero [funcionalidade], Para [benefício]<br />
          • Critérios: Lista com - [ ] item
        </AlertDescription>
      </Alert>

      {/* Botões de ação */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleParse}
          disabled={!isValid || !parsedStory}
          className="gradient-primary text-white hover-lift"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Criar User Story
        </Button>
      </div>
    </div>
  );
}
