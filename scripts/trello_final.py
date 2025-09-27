#!/usr/bin/env python3
"""
Script final para extrair dados do Trello para burndown chart
Trabalha com os dados que realmente existem no JSON
"""

import json
import sys
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

def extract_cards(board_data: Dict[str, Any], lists: Dict[str, str]) -> List[Dict[str, Any]]:
    """Extrai os cards do board com informações relevantes"""
    cards = []
    
    if 'cards' in board_data:
        for card in board_data['cards']:
            # Extrair story points do nome do card (ex: [5], [3], etc.)
            story_points = 0
            name = card.get('name', '')
            import re
            sp_match = re.search(r'\[(\d+)\]', name)
            if sp_match:
                story_points = int(sp_match.group(1))
            
            # Informações básicas do card
            card_info = {
                'id': card.get('id', ''),
                'name': name,
                'desc': card.get('desc', ''),
                'list_name': lists.get(card.get('idList', ''), 'Unknown'),
                'closed': card.get('closed', False),
                'due': card.get('due', None),
                'dateLastActivity': card.get('dateLastActivity', None),
                'story_points': story_points,
                'labels': [label.get('name', '') for label in card.get('labels', [])],
                'members': card.get('idMembers', []),
                'badges': {
                    'comments': card.get('badges', {}).get('comments', 0),
                    'attachments': card.get('badges', {}).get('attachments', 0),
                    'checkItems': card.get('badges', {}).get('checkItems', 0),
                    'checkItemsChecked': card.get('badges', {}).get('checkItemsChecked', 0)
                }
            }
            
            cards.append(card_info)
    
    return cards

def format_for_burndown(cards: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Formata os dados para uso no burndown chart"""
    
    # Calcular totais
    total_cards = len(cards)
    completed_cards = len([c for c in cards if c['closed']])
    pending_cards = len([c for c in cards if not c['closed']])
    
    # Calcular story points
    total_story_points = sum(card['story_points'] for card in cards)
    completed_story_points = sum(card['story_points'] for card in cards if card['closed'])
    pending_story_points = total_story_points - completed_story_points
    
    burndown_data = {
        'board_info': {
            'total_cards': total_cards,
            'completed_cards': completed_cards,
            'pending_cards': pending_cards,
            'total_story_points': total_story_points,
            'completed_story_points': completed_story_points,
            'pending_story_points': pending_story_points,
            'completion_percentage': round((completed_cards / total_cards * 100), 2) if total_cards > 0 else 0,
            'story_points_completion_percentage': round((completed_story_points / total_story_points * 100), 2) if total_story_points > 0 else 0
        },
        'cards_by_list': {},
        'cards_by_story_points': {},
        'cards': []
    }
    
    # Agrupar cards por lista
    for card in cards:
        list_name = card['list_name']
        if list_name not in burndown_data['cards_by_list']:
            burndown_data['cards_by_list'][list_name] = []
        burndown_data['cards_by_list'][list_name].append(card)
    
    # Agrupar cards por story points
    for card in cards:
        sp = card['story_points']
        if sp not in burndown_data['cards_by_story_points']:
            burndown_data['cards_by_story_points'][sp] = []
        burndown_data['cards_by_story_points'][sp].append(card)
    
    # Preparar dados dos cards para o burndown
    for card in cards:
        card_data = {
            'id': card['id'],
            'title': card['name'],
            'description': card['desc'],
            'status': 'completed' if card['closed'] else 'pending',
            'list': card['list_name'],
            'story_points': card['story_points'],
            'due_date': card['due'],
            'last_activity': card['dateLastActivity'],
            'labels': card['labels'],
            'members': card['members'],
            'badges': card['badges']
        }
        burndown_data['cards'].append(card_data)
    
    return burndown_data

def print_summary(burndown_data: Dict[str, Any]):
    """Imprime um resumo dos dados extraídos"""
    board_info = burndown_data['board_info']
    
    print("=" * 70)
    print("RESUMO DO BOARD TRELLO - BURNDOWN CHART")
    print("=" * 70)
    print(f"📊 ESTATÍSTICAS GERAIS:")
    print(f"   Total de Cards: {board_info['total_cards']}")
    print(f"   Cards Concluídos: {board_info['completed_cards']}")
    print(f"   Cards Pendentes: {board_info['pending_cards']}")
    print(f"   Taxa de Conclusão: {board_info['completion_percentage']}%")
    print()
    
    print(f"🎯 STORY POINTS:")
    print(f"   Total de Story Points: {board_info['total_story_points']}")
    print(f"   Story Points Concluídos: {board_info['completed_story_points']}")
    print(f"   Story Points Pendentes: {board_info['pending_story_points']}")
    print(f"   Taxa de Conclusão SP: {board_info['story_points_completion_percentage']}%")
    print()
    
    print("📋 CARDS POR LISTA:")
    print("-" * 40)
    for list_name, cards in burndown_data['cards_by_list'].items():
        completed = len([c for c in cards if c['closed']])
        pending = len(cards) - completed
        print(f"   {list_name}: {len(cards)} cards ({completed} concluídos, {pending} pendentes)")
    print()
    
    print("🎲 CARDS POR STORY POINTS:")
    print("-" * 40)
    for sp, cards in sorted(burndown_data['cards_by_story_points'].items()):
        if sp > 0:  # Só mostrar cards com story points
            completed = len([c for c in cards if c['closed']])
            pending = len(cards) - completed
            print(f"   [{sp} SP]: {len(cards)} cards ({completed} concluídos, {pending} pendentes)")

def save_burndown_data(burndown_data: Dict[str, Any], output_file: str):
    """Salva os dados formatados em um arquivo JSON"""
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(burndown_data, file, indent=2, ensure_ascii=False, default=str)
    print(f"💾 Dados salvos em: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Uso: python trello_final.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    print(f"🚀 Processando arquivo: {filename}")
    print("📥 Carregando dados do Trello...")
    
    # Carregar dados do Trello
    board_data = load_trello_json(filename)
    
    print("📋 Extraindo listas...")
    lists = extract_lists(board_data)
    
    print("🎯 Extraindo cards e calculando story points...")
    cards = extract_cards(board_data, lists)
    
    print("📊 Formatando dados para burndown...")
    burndown_data = format_for_burndown(cards)
    
    # Imprimir resumo
    print_summary(burndown_data)
    
    # Salvar dados formatados
    output_file = "burndown_data_final.json"
    save_burndown_data(burndown_data, output_file)
    
    print("\n✅ Processamento concluído!")
    print("🎉 Agora você pode usar os dados no seu burndown chart!")

if __name__ == "__main__":
    main()
