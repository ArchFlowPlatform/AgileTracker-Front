#!/usr/bin/env python3
"""
Script final para extrair APENAS as TASKS reais do Trello para burndown chart
Ignora User Stories (US) e foca nas tasks com códigos (ED 002, TP 003, etc.)
"""

import json
import sys
import re
from datetime import datetime
from typing import Dict, List, Any

def load_trello_json(filename: str) -> Dict[str, Any]:
    """Carrega o arquivo JSON do Trello"""
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Erro: Arquivo {filename} não encontrado")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")
        sys.exit(1)

def extract_lists(board_data: Dict[str, Any]) -> Dict[str, str]:
    """Extrai as listas (colunas) do board"""
    lists = {}
    if 'lists' in board_data:
        for list_item in board_data['lists']:
            lists[list_item['id']] = list_item['name']
    return lists

def extract_tasks_only(board_data: Dict[str, Any], lists: Dict[str, str]) -> List[Dict[str, Any]]:
    """Extrai APENAS as tasks reais (ignora User Stories)"""
    tasks = []
    
    if 'cards' in board_data:
        for card in board_data['cards']:
            name = card.get('name', '')
            
            # Pular User Stories (começam com US)
            if re.match(r'^US\d+', name):
                continue
            
            # Pular cards que não são tasks (sem código como ED 002, TP 003, etc.)
            if not re.search(r'→\s*[A-Z]{2,4}\s*\d+', name):
                continue
            
            # Extrair story points do nome da task
            story_points = 0
            sp_match = re.search(r'\[(\d+)\s*SP?\]', name)
            if sp_match:
                story_points = int(sp_match.group(1))
            
            # Extrair código da task (ED 002, TP 003, etc.)
            code_match = re.search(r'→\s*([A-Z]{2,4})\s*(\d+)', name)
            task_code = ""
            if code_match:
                task_code = f"{code_match.group(1)} {code_match.group(2)}"
            
            # Informações da task
            task_info = {
                'id': card.get('id', ''),
                'name': name,
                'desc': card.get('desc', ''),
                'list_name': lists.get(card.get('idList', ''), 'Unknown'),
                'closed': card.get('closed', False),
                'due': card.get('due', None),
                'dateLastActivity': card.get('dateLastActivity', None),
                'story_points': story_points,
                'task_code': task_code,
                'labels': [label.get('name', '') for label in card.get('labels', [])],
                'members': card.get('idMembers', []),
                'badges': {
                    'comments': card.get('badges', {}).get('comments', 0),
                    'attachments': card.get('badges', {}).get('attachments', 0),
                    'checkItems': card.get('badges', {}).get('checkItems', 0),
                    'checkItemsChecked': card.get('badges', {}).get('checkItemsChecked', 0)
                }
            }
            
            tasks.append(task_info)
    
    return tasks

def format_for_burndown(tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Formata os dados para uso no burndown chart"""
    
    # Calcular totais
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t['closed']])
    pending_tasks = len([t for t in tasks if not t['closed']])
    
    # Calcular story points
    total_story_points = sum(task['story_points'] for task in tasks)
    completed_story_points = sum(task['story_points'] for task in tasks if task['closed'])
    pending_story_points = total_story_points - completed_story_points
    
    burndown_data = {
        'board_info': {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'total_story_points': total_story_points,
            'completed_story_points': completed_story_points,
            'pending_story_points': pending_story_points,
            'completion_percentage': round((completed_tasks / total_tasks * 100), 2) if total_tasks > 0 else 0,
            'story_points_completion_percentage': round((completed_story_points / total_story_points * 100), 2) if total_story_points > 0 else 0
        },
        'tasks_by_list': {},
        'tasks_by_code': {},
        'tasks_by_story_points': {},
        'tasks': []
    }
    
    # Agrupar tasks por lista
    for task in tasks:
        list_name = task['list_name']
        if list_name not in burndown_data['tasks_by_list']:
            burndown_data['tasks_by_list'][list_name] = []
        burndown_data['tasks_by_list'][list_name].append(task)
    
    # Agrupar tasks por código
    for task in tasks:
        code = task['task_code']
        if code not in burndown_data['tasks_by_code']:
            burndown_data['tasks_by_code'][code] = []
        burndown_data['tasks_by_code'][code].append(task)
    
    # Agrupar tasks por story points
    for task in tasks:
        sp = task['story_points']
        if sp not in burndown_data['tasks_by_story_points']:
            burndown_data['tasks_by_story_points'][sp] = []
        burndown_data['tasks_by_story_points'][sp].append(task)
    
    # Preparar dados das tasks para o burndown
    for task in tasks:
        task_data = {
            'id': task['id'],
            'title': task['name'],
            'description': task['desc'],
            'status': 'completed' if task['closed'] else 'pending',
            'list': task['list_name'],
            'story_points': task['story_points'],
            'task_code': task['task_code'],
            'due_date': task['due'],
            'last_activity': task['dateLastActivity'],
            'labels': task['labels'],
            'members': task['members'],
            'badges': task['badges']
        }
        burndown_data['tasks'].append(task_data)
    
    return burndown_data

def print_summary(burndown_data: Dict[str, Any]):
    """Imprime um resumo dos dados extraídos"""
    board_info = burndown_data['board_info']
    
    print("=" * 70)
    print("RESUMO DAS TASKS REAIS - BURNDOWN CHART")
    print("=" * 70)
    print(f"🎯 ESTATÍSTICAS DAS TASKS:")
    print(f"   Total de Tasks: {board_info['total_tasks']}")
    print(f"   Tasks Concluídas: {board_info['completed_tasks']}")
    print(f"   Tasks Pendentes: {board_info['pending_tasks']}")
    print(f"   Taxa de Conclusão: {board_info['completion_percentage']}%")
    print()
    
    print(f"🎲 STORY POINTS:")
    print(f"   Total de Story Points: {board_info['total_story_points']}")
    print(f"   Story Points Concluídos: {board_info['completed_story_points']}")
    print(f"   Story Points Pendentes: {board_info['pending_story_points']}")
    print(f"   Taxa de Conclusão SP: {board_info['story_points_completion_percentage']}%")
    print()
    
    print("📋 TASKS POR LISTA:")
    print("-" * 40)
    for list_name, tasks in burndown_data['tasks_by_list'].items():
        completed = len([t for t in tasks if t['closed']])
        pending = len(tasks) - completed
        print(f"   {list_name}: {len(tasks)} tasks ({completed} concluídas, {pending} pendentes)")
    print()
    
    print("🏷️ TASKS POR CÓDIGO:")
    print("-" * 40)
    for code, tasks in sorted(burndown_data['tasks_by_code'].items()):
        completed = len([t for t in tasks if t['closed']])
        pending = len(tasks) - completed
        print(f"   {code}: {len(tasks)} tasks ({completed} concluídas, {pending} pendentes)")
    print()
    
    print("🎲 TASKS POR STORY POINTS:")
    print("-" * 40)
    for sp, tasks in sorted(burndown_data['tasks_by_story_points'].items()):
        if sp > 0:  # Só mostrar tasks com story points
            completed = len([t for t in tasks if t['closed']])
            pending = len(tasks) - completed
            print(f"   [{sp} SP]: {len(tasks)} tasks ({completed} concluídas, {pending} pendentes)")

def save_burndown_data(burndown_data: Dict[str, Any], output_file: str):
    """Salva os dados formatados em um arquivo JSON"""
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(burndown_data, file, indent=2, ensure_ascii=False, default=str)
    print(f"💾 Dados salvos em: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Uso: python trello_tasks_only.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    print(f"🚀 Processando arquivo: {filename}")
    print("📥 Carregando dados do Trello...")
    
    # Carregar dados do Trello
    board_data = load_trello_json(filename)
    
    print("📋 Extraindo listas...")
    lists = extract_lists(board_data)
    
    print("🎯 Extraindo APENAS as tasks reais (ignorando User Stories)...")
    tasks = extract_tasks_only(board_data, lists)
    
    print("📊 Formatando dados para burndown...")
    burndown_data = format_for_burndown(tasks)
    
    # Imprimir resumo
    print_summary(burndown_data)
    
    # Salvar dados formatados
    output_file = "burndown_tasks_only.json"
    save_burndown_data(burndown_data, output_file)
    
    print("\n✅ Processamento concluído!")
    print("🎉 Agora você tem apenas as TASKS REAIS para o burndown chart!")

if __name__ == "__main__":
    main()
