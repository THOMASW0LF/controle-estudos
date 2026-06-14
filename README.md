# Controle de Estudos

Aplicativo mobile desenvolvido em React Native com Expo para controle dos estudos.

## Integrantes

- Thomas Wolf
- João W
- Wesley

## Objetivo

Permitir que estudantes registrem matérias e assuntos estudados, mantendo os dados disponíveis mesmo sem conexão com a internet.

## Público-Alvo

Estudantes que desejam organizar e acompanhar seus estudos de forma simples.

## Tecnologias Utilizadas

- React Native
- Expo
- Expo Router
- Firebase Firestore
- AsyncStorage
- TypeScript

## Dependências Principais

```bash
npm install firebase

npx expo install @react-native-async-storage/async-storage
```

## Funcionalidades Implementadas

- Cadastro de estudos
- Listagem de estudos
- Navegação entre telas
- Persistência local com AsyncStorage
- Integração com Firebase Firestore
- Funcionamento offline
- Leitura dos dados armazenados localmente

## Estrutura do Projeto

```text
src/
├── app/
│   ├── index.tsx
│   ├── add-study.tsx
│   └── studies.tsx
│
├── services/
│   └── firebase.ts
```

## Estratégia Offline First

O aplicativo utiliza o AsyncStorage para armazenar os estudos localmente no dispositivo.

Fluxo atual:

1. O usuário cadastra um estudo.
2. O estudo é salvo localmente.
3. Os dados permanecem disponíveis mesmo sem internet.
4. Quando houver conexão, os dados também são enviados para o Firebase.


## Como Executar

Instalar dependências:

```bash
npm install
```

Executar o projeto:

```bash
npx expo start
```

## Status do Projeto

### Semana 1
- Definição do tema
- Definição do escopo
- Prototipação das telas

### Semana 2
- Estrutura inicial do projeto
- Configuração do Expo
- Configuração do Firebase
- Implementação das telas
- Persistência local com AsyncStorage
- Implementação do funcionamento offline

### Semana 3

- Editar estudos
- Excluir estudos
- Melhorar sincronização entre AsyncStorage e Firebase
- Tratamento avançado de erros
- Indicador de conexão
