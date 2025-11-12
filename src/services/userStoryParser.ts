// Serviço para parsing de User Stories a partir de texto
// Reconhece o formato padrão e extrai informações automaticamente

export interface ParsedUserStory {
  title: string;
  description: string;
  storyPoints: number;
  priority: 'High' | 'Medium' | 'Low';
  acceptanceCriteria: string[];
  tags: string[];
}

export class UserStoryParser {
  // Regex patterns para reconhecer diferentes partes (mais flexíveis)
  private static readonly PATTERNS = {
    // US01 - Painel Unificado de Parâmetros (RF01) ou US08 - Configuração...
    title: /^(US\d+\s*-\s*.+?)(?:\s*\([^)]+\))?$/m,
    
    // Prioridade: Alta | Story Points: 8 (mais flexível)
    priorityAndPoints: /Prioridade:\s*(Alta|Média|Baixa|High|Medium|Low)\s*\|\s*Story Points:\s*(\d+)/i,
    
    // Como usuário, Quero visualizar..., Para obter... (mais flexível)
    description: /Como\s+([^,\n]+),?\s*Quero\s+(.+?),\s*Para\s+(.+?)(?=\n|$)/s,
    
    // Critérios de Aceitação: (mais flexível)
    acceptanceCriteria: /Critérios de Aceitação:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|\nPrioridade:|$)/i,
    
    // - [ ] item ou qualquer bullet point (detecção mais robusta)
    criteriaItems: /(?:-\s*\[\s*\]\s*|[\u2022\u2023\u25E6\u2043\u2219\u00B7\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022]\s*)(.+)/g,
  };

  static parse(text: string): ParsedUserStory | null {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length === 0) return null;

      // Extrair título (primeira linha que começa com US)
      const titleLine = lines.find(line => line.match(/^US\d+/));
      if (!titleLine) return null;
      
      const titleMatch = titleLine.match(this.PATTERNS.title);
      if (!titleMatch) return null;
      
      const title = titleMatch[1].trim();

      // Extrair prioridade e story points (pode estar em qualquer lugar do texto)
      const priorityPointsMatch = text.match(this.PATTERNS.priorityAndPoints);
      if (!priorityPointsMatch) return null;

      const priorityText = priorityPointsMatch[1].toLowerCase();
      const priority: 'High' | 'Medium' | 'Low' = 
        priorityText.includes('alta') || priorityText.includes('high') ? 'High' :
        priorityText.includes('média') || priorityText.includes('medium') ? 'Medium' : 'Low';

      const storyPoints = parseInt(priorityPointsMatch[2]);

      // Extrair descrição (mais flexível)
      const descriptionMatch = text.match(this.PATTERNS.description);
      if (!descriptionMatch) return null;

      const role = descriptionMatch[1].trim();
      const want = descriptionMatch[2].trim();
      const soThat = descriptionMatch[3].trim();

      const description = `Como ${role},\nQuero ${want},\nPara ${soThat}`;

      // Extrair critérios de aceitação (mais flexível)
      const criteriaMatch = text.match(this.PATTERNS.acceptanceCriteria);
      let acceptanceCriteria: string[] = [];
      
      console.log('🔍 Debug - Texto completo:', JSON.stringify(text));
      console.log('🔍 Debug - Critérios Match:', criteriaMatch);
      
      if (criteriaMatch) {
        const criteriaText = criteriaMatch[1];
        console.log('🔍 Debug - Texto dos critérios:', JSON.stringify(criteriaText));
        
        // Abordagem mais robusta: dividir por linhas e detectar qualquer bullet point
        const lines = criteriaText.split('\n').map(line => line.trim()).filter(line => line);
        console.log('🔍 Debug - Linhas encontradas:', lines.length);
        
        lines.forEach((line, index) => {
          console.log(`🔍 Debug - Linha ${index + 1}:`, JSON.stringify(line));
          // Detectar se a linha começa com qualquer caractere não-alfabético seguido de espaço
          const match = line.match(/^[^\w\s]\s*(.+)$/);
          if (match) {
            console.log(`🔍 Debug - Item extraído da linha ${index + 1}:`, JSON.stringify(match[1].trim()));
            acceptanceCriteria.push(match[1].trim());
          }
        });
        
        console.log('🔍 Debug - Critérios finais:', acceptanceCriteria);
      } else {
        console.log('❌ Debug - Nenhum critério encontrado!');
      }

      // Extrair tags do título e descrição
      const tags = this.extractTags(title + ' ' + description);

      return {
        title,
        description,
        storyPoints,
        priority,
        acceptanceCriteria,
        tags,
      };
    } catch (error) {
      console.error('Erro ao fazer parsing da User Story:', error);
      return null;
    }
  }

  private static extractTags(text: string): string[] {
    const commonTechs = [
      'Docker', 'PostgreSQL', 'Node.js', 'React', 'TypeScript', 'JavaScript',
      'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Kubernetes',
      'AWS', 'Azure', 'GCP', 'MongoDB', 'Redis', 'MySQL', 'SQLite',
      'GraphQL', 'REST', 'API', 'Frontend', 'Backend', 'Fullstack',
      'Mobile', 'iOS', 'Android', 'Flutter', 'React Native', 'Vue',
      'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Express', 'Fastify',
      'Prisma', 'Sequelize', 'TypeORM', 'Jest', 'Cypress', 'Playwright'
    ];

    const tags: string[] = [];
    const lowerText = text.toLowerCase();

    commonTechs.forEach(tech => {
      if (lowerText.includes(tech.toLowerCase())) {
        tags.push(tech);
      }
    });

    return tags;
  }

  // Valida se o texto parece ser uma User Story válida (mais flexível)
  static isValidFormat(text: string): boolean {
    // Verifica se tem pelo menos uma linha começando com US
    const hasTitle = /^US\d+/m.test(text);
    
    // Verifica se tem prioridade e story points
    const hasPriorityPoints = this.PATTERNS.priorityAndPoints.test(text);
    
    // Verifica se tem descrição no formato "Como... Quero... Para..."
    const hasDescription = this.PATTERNS.description.test(text);
    
    return hasTitle && hasPriorityPoints && hasDescription;
  }

  // Preview do que será extraído (para mostrar antes de criar)
  static getPreview(text: string): string {
    const parsed = this.parse(text);
    if (!parsed) return 'Formato não reconhecido';

    return `
📋 **Preview da User Story:**

**Título:** ${parsed.title}
**Prioridade:** ${parsed.priority}
**Story Points:** ${parsed.storyPoints}
**Descrição:** ${parsed.description}
**Critérios:** ${parsed.acceptanceCriteria.length} item(s)
**Tags:** ${parsed.tags.join(', ') || 'Nenhuma'}

✅ Pronto para criar!
    `.trim();
  }
}
