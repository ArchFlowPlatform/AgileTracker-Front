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
  // Regex patterns para reconhecer diferentes partes
  private static readonly PATTERNS = {
    // US08 - Configuração de Ambiente Containerizado
    title: /^(US\d+\s*-\s*.+)$/m,
    
    // Prioridade: Alta | Story Points: 5
    priorityAndPoints: /Prioridade:\s*(Alta|Média|Baixa|High|Medium|Low)\s*\|\s*Story Points:\s*(\d+)/i,
    
    // Como desenvolvedor, Quero um ambiente..., Para garantir...
    description: /Como\s+([^,]+),\s*Quero\s+(.+?),\s*Para\s+(.+?)(?=\n|$)/,
    
    // Critérios de Aceitação: - [ ] item
    acceptanceCriteria: /Critérios de Aceitação:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
    
    // - [ ] Docker Compose com PostgreSQL...
    criteriaItems: /-\s*\[\s*\]\s*(.+)/g,
  };

  static parse(text: string): ParsedUserStory | null {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length === 0) return null;

      // Extrair título
      const titleMatch = lines[0].match(this.PATTERNS.title);
      if (!titleMatch) return null;
      
      const title = titleMatch[1].trim();

      // Extrair prioridade e story points
      const priorityPointsMatch = text.match(this.PATTERNS.priorityAndPoints);
      if (!priorityPointsMatch) return null;

      const priorityText = priorityPointsMatch[1].toLowerCase();
      const priority: 'High' | 'Medium' | 'Low' = 
        priorityText.includes('alta') || priorityText.includes('high') ? 'High' :
        priorityText.includes('média') || priorityText.includes('medium') ? 'Medium' : 'Low';

      const storyPoints = parseInt(priorityPointsMatch[2]);

      // Extrair descrição
      const descriptionMatch = text.match(this.PATTERNS.description);
      if (!descriptionMatch) return null;

      const role = descriptionMatch[1].trim();
      const want = descriptionMatch[2].trim();
      const soThat = descriptionMatch[3].trim();

      const description = `Como ${role},\nQuero ${want},\nPara ${soThat}`;

      // Extrair critérios de aceitação
      const criteriaMatch = text.match(this.PATTERNS.acceptanceCriteria);
      let acceptanceCriteria: string[] = [];
      
      if (criteriaMatch) {
        const criteriaText = criteriaMatch[1];
        const items = [...criteriaText.matchAll(this.PATTERNS.criteriaItems)];
        acceptanceCriteria = items.map(item => item[1].trim()).filter(item => item);
      }

      // Extrair tags do título (tecnologias mencionadas)
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

  // Valida se o texto parece ser uma User Story válida
  static isValidFormat(text: string): boolean {
    const hasTitle = this.PATTERNS.title.test(text);
    const hasPriorityPoints = this.PATTERNS.priorityAndPoints.test(text);
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
