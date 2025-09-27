#!/usr/bin/env python3
"""
Script melhorado para extrair cards e tasks do JSON do Trello
"""

import json
import sys
from datetime import datetime
from typing import Dict, List, Any

def analyze_json_structure(filename: str):
    """Analisa a estrutura do JSON para entender como os dados estão organizados"""
    print("Analisando estrutura do JSON...")
    
    with open(filename, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    print(f"Chaves principais no JSON: {list(data.keys())}")
    
    # Verificar se há checklists no nível do board
    if 'checklists' in data:
        print(f"Checklists encontrados no board: {len(data['checklists'])}")
        if data['checklists']:
            print(f"Primeiro checklist: {data['checklists'][0]}")
    
    # Verificar se há checklists dentro dos cards
    if 'cards' in data:
        print(f"Cards encontrados: {len(data['cards'])}")
        cards_with_checklists = 0
        for card in data['cards'][:5]:  # Verificar apenas os primeiros 5 cards
            if 'checklists' in card:
                cards_with_checklists += 1
                print(f"Card '{card.get('name', 'Sem nome')}' tem {len(card['checklists'])} checklists")
                for checklist in card['checklists']:
                    print(f"  - Checklist: {checklist.get('name', 'Sem nome')}")
                    if 'checkItems' in checklist:
                        print(f"    Items: {len(checklist['checkItems'])}")
                        for item in checklist['checkItems'][:3]:  # Mostrar apenas os primeiros 3
                            print(f"      - {item.get('name', 'Sem nome')} ({item.get('state', 'unknown')})")
        
        print(f"Cards com checklists: {cards_with_checklists}")

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

def extract_cards_and_tasks(board_data: Dict[str, Any], lists: Dict[str, str]) -> List[Dict[str, Any]]:
    """Extrai os cards e suas tasks do board"""
    cards = []
    
    # Criar um mapa de checklists por card ID
    checklists_by_card = {}
    if 'checklists' in board_data:
        for checklist in board_data['checklists']:
            card_id = checklist.get('idCard', '')
            if card_id not in checklists_by_card:
                checklists_by_card[card_id] = []
            checklists_by_card[card_id].append(checklist)
    
    if 'cards' in board_data:
        for card in board_data['cards']:
            # Informações básicas do card
            card_info = {
                'id': card.get('id', ''),
                'name': card.get('name', ''),
                'desc': card.get('desc', ''),
                'list_name': lists.get(card.get('idList', ''), 'Unknown'),
                'closed': card.get('closed', False),
                'due': card.get('due', None),
                'dateLastActivity': card.get('dateLastActivity', None),
                'tasks': []
            }
            
            # Extrair tasks dos checklists associados ao card
            card_id = card.get('id', '')
            if card_id in checklists_by_card:
                for checklist in checklists_by_card[card_id]:
                    if 'checkItems' in checklist and checklist['checkItems']:
                        for item in checklist['checkItems']:
                            task = {
                                'id': item.get('id', ''),
                                'name': item.get('name', ''),
                                'state': item.get('state', 'incomplete'),
                                'due': item.get('due', None),
                                'checklist_name': checklist.get('name', '')
                            }
                            card_info['tasks'].append(task)
            
            cards.append(card_info)
    
    return cards

def format_for_burndown(cards: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Formata os dados para uso no burndown chart"""
    burndown_data = {
        'total_cards': len(cards),
        'completed_cards': len([c for c in cards if c['closed']]),
        'pending_cards': len([c for c in cards if not c['closed']]),
        'total_tasks': sum(len(card['tasks']) for card in cards),
        'completed_tasks': sum(len([t for t in card['tasks'] if t['state'] == 'complete']) for card in cards),
        'pending_tasks': sum(len([t for t in card['tasks'] if t['state'] != 'complete']) for card in cards),
        'cards_by_list': {},
        'cards': []
    }
    
    # Agrupar cards por lista
    for card in cards:
        list_name = card['list_name']
        if list_name not in burndown_data['cards_by_list']:
            burndown_data['cards_by_list'][list_name] = []
        burndown_data['cards_by_list'][list_name].append(card)
    
    # Preparar dados dos cards para o burndown
    for card in cards:
        card_data = {
            'id': card['id'],
            'title': card['name'],
            'description': card['desc'],
            'status': 'completed' if card['closed'] else 'pending',
            'list': card['list_name'],
            'due_date': card['due'],
            'last_activity': card['dateLastActivity'],
            'tasks': card['tasks'],
            'task_count': len(card['tasks']),
            'completed_task_count': len([t for t in card['tasks'] if t['state'] == 'complete'])
        }
        burndown_data['cards'].append(card_data)
    
    return burndown_data

def print_summary(burndown_data: Dict[str, Any]):
    """Imprime um resumo dos dados extraídos"""
    print("=" * 60)
    print("RESUMO DO BOARD TRELLO")
    print("=" * 60)
    print(f"Total de Cards: {burndown_data['total_cards']}")
    print(f"Cards Concluídos: {burndown_data['completed_cards']}")
    print(f"Cards Pendentes: {burndown_data['pending_cards']}")
    print(f"Total de Tasks: {burndown_data['total_tasks']}")
    print(f"Tasks Concluídas: {burndown_data['completed_tasks']}")
    print(f"Tasks Pendentes: {burndown_data['pending_tasks']}")
    print()
    
    print("CARDS POR LISTA:")
    print("-" * 30)
    for list_name, cards in burndown_data['cards_by_list'].items():
        print(f"{list_name}: {len(cards)} cards")
    print()

def save_burndown_data(burndown_data: Dict[str, Any], output_file: str):
    """Salva os dados formatados em um arquivo JSON"""
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(burndown_data, file, indent=2, ensure_ascii=False, default=str)
    print(f"Dados salvos em: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Uso: python trello_parser_v2.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    print(f"Processando arquivo: {filename}")
    
    # Primeiro, analisar a estrutura
    analyze_json_structure(filename)
    
    print("\nCarregando dados do Trello...")
    
    # Carregar dados do Trello
    board_data = load_trello_json(filename)
    
    print("Extraindo listas...")
    lists = extract_lists(board_data)
    
    print("Extraindo cards e tasks...")
    cards = extract_cards_and_tasks(board_data, lists)
    
    print("Formatando dados para burndown...")
    burndown_data = format_for_burndown(cards)
    
    # Imprimir resumo
    print_summary(burndown_data)
    
    # Salvar dados formatados
    output_file = "burndown_data_v2.json"
    save_burndown_data(burndown_data, output_file)
    
    print("Processamento concluído!")

if __name__ == "__main__":
    main()
