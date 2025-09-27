#!/usr/bin/env python3
"""
Script para verificar todas as colunas do board Trello
"""

import json
import sys

def check_all_columns(filename: str):
    """Verifica todas as colunas do board"""
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except FileNotFoundError:
        print(f"Erro: Arquivo {filename} não encontrado")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")
        sys.exit(1)
    
    print("📋 TODAS AS COLUNAS NO BOARD:")
    print("=" * 60)
    
    if 'lists' in data:
        for i, lista in enumerate(data['lists'], 1):
            print(f"{i}. {lista['name']}")
            print(f"   ID: {lista['id']}")
            print(f"   Fechada: {lista.get('closed', False)}")
            print(f"   Posição: {lista.get('pos', 'N/A')}")
            print()
    
    print(f"Total de colunas: {len(data['lists'])}")

def main():
    if len(sys.argv) != 2:
        print("Uso: python check_columns.py <arquivo_trello.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    check_all_columns(filename)

if __name__ == "__main__":
    main()
