#!/usr/bin/env python3
"""
Script para gerar JSON ajustado para o kanban board
"""

import json
import sys
import re
from datetime import datetime

def extract_tasks_for_kanban(filename: str):
    """Extrai tasks e formata para o kanban board"""
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except FileNotFoundError:
        print(f"Erro: Arquivo {filename} não encontrado")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")
        sys.exit(1)
    
    # Criar mapa de listas
    lists_map = {}
    if 'lists' in data:
        for list_item in data['lists']:
            lists_map[list_item['id']] = list_item['name']
    
    # Criar mapa de membros
    members_map = {}
    if 'members' in data:
        for member in data['members']:
            members_map[member['id']] = {
                'name': member.get('fullName', member.get('username', 'Unknown')),
                'initials': member.get('initials', 'U'),
                'avatar': member.get('avatarUrl', '')
            }
    
    tasks = []
    columns = {}
    
    # Primeiro, criar todas as colunas (mesmo as vazias)
    if 'lists' in data:
        for list_item in data['lists']:
            list_name = list_item['name']
            list_id = list_item['id']
            
            # Definir cores específicas para cada coluna
            color_map = {
                'TO DO': '#3b82f6',           # Azul
                'DOING': '#f59e0b',           # Amarelo
                'REVIEW/FIX': '#ef4444',      # Vermelho
                'WAITING VALIDATION': '#8b5cf6', # Roxo
                'DONE SP1': '#10b981',        # Verde
                'Dailys': '#6b7280',          # Cinza
                'Guide': '#f97316'            # Laranja
            }
            
            columns[list_name] = {
                'id': list_id,
                'name': list_name,
                'color': color_map.get(list_name, '#3b82f6'),
                'taskLimit': None,
                'isCollapsed': False
            }
    
    # Depois, processar apenas as tasks com códigos
    if 'cards' in data:
        for card in data['cards']:
            name = card.get('name', '')
            list_id = card.get('idList', '')
            list_name = lists_map.get(list_id, 'Unknown')
            
            # Pular User Stories (começam com US)
            if re.match(r'^US\d+', name):
                continue
            
            # Pular cards que não são tasks (sem código como ED 002, TP 003, etc.)
            if not re.search(r'→\s*[A-Z]{2,4}\s*\d+', name):
                continue
            
            # Extrair story points
            story_points = 0
            sp_match = re.search(r'\[(\d+)\s*SP?\]', name)
            if sp_match:
                story_points = int(sp_match.group(1))
            
            # Extrair código da task
            code_match = re.search(r'→\s*([A-Z]{2,4})\s*(\d+)', name)
            task_code = ""
            if code_match:
                task_code = f"{code_match.group(1)} {code_match.group(2)}"
            
            # Extrair labels
            labels = []
            if 'labels' in card:
                labels = [label.get('name', '') for label in card['labels']]
            
            # Extrair membros atribuídos
            assigned_members = []
            if 'idMembers' in card:
                for member_id in card['idMembers']:
                    if member_id in members_map:
                        assigned_members.append(members_map[member_id])
            
            # Criar task
            task = {
                'id': card.get('id', ''),
                'title': name,
                'description': card.get('desc', ''),
                'column': list_name,
                'storyPoints': story_points,
                'taskCode': task_code,
                'labels': labels,
                'assignedMembers': assigned_members,
                'dueDate': card.get('due', None),
                'lastActivity': card.get('dateLastActivity', None),
                'isCompleted': card.get('closed', False),
                'priority': 'medium',  # Default priority
                'createdAt': datetime.now().isoformat()
            }
            
            tasks.append(task)
    
    # Criar estrutura final do kanban
    kanban_data = {
        'board': {
            'id': data.get('id', ''),
            'name': data.get('name', 'Kanban Board'),
            'description': data.get('desc', ''),
            'createdAt': datetime.now().isoformat(),
            'lastModified': datetime.now().isoformat()
        },
        'columns': list(columns.values()),
        'tasks': tasks,
        'members': list(members_map.values()),
        'labels': [
            {'id': f'label_{i}', 'name': label, 'color': '#3b82f6'}
            for i, label in enumerate(set([label for task in tasks for label in task['labels']]))
        ]
    }
    
    return kanban_data

def main():
    if len(sys.argv) != 2:
        print("Uso: python generate_kanban_json.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    print("🚀 Gerando JSON para kanban board...")
    
    kanban_data = extract_tasks_for_kanban(filename)
    
    # Salvar arquivo
    output_file = "kanban_data.json"
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(kanban_data, file, indent=2, ensure_ascii=False, default=str)
    
    print(f"✅ JSON gerado: {output_file}")
    print(f"📊 Colunas: {len(kanban_data['columns'])}")
    print(f"🎯 Tasks: {len(kanban_data['tasks'])}")
    print(f"👥 Membros: {len(kanban_data['members'])}")
    print(f"🏷️ Labels: {len(kanban_data['labels'])}")
    
    print("\n📋 COLUNAS ENCONTRADAS:")
    for column in kanban_data['columns']:
        task_count = len([task for task in kanban_data['tasks'] if task['column'] == column['name']])
        print(f"   - {column['name']}: {task_count} tasks")

if __name__ == "__main__":
    main()
