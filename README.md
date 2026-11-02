# Cofre Clínico

O Cofre Clínico é um aplicativo voltado a organização de imagens sensíveis por profissionais da saúde. 

Durante o acompanhamento de diversos pacientes, profissionais como dermatologistas precisam capturar imagens das condições tratadas para avaliar o desenvolvimento ao longo do tempo ou fazerem análises médicas. 

Em nosso levantamento feito com profissionais do meio, foi identificado que muitos deixam essas imagens salvas na galeria comum do celular. O que pode ser inadequado, visto que as imagens podem não ser organizadas por paciente separadamente, gerando possíveis confusões que venham a atrapalhar o acompanhamento ou identificar cada caso individual. Além de que pela natureza do trabalho, deve-se haver um cuidado com a privacidade.

Para resolver esse problema, buscamos criar uma solução através de um aplicativo que possa organizar melhor essas fotos e informações sensíveis. 

O desenvolvimento foi feito usando uma arquitetura MVVM (Model-View-ViewModel), visando facilitar a manutenção. 

## Configuração

1. Instale as dependências

   ```bash
   npm install
   ```

2. Execute o app

   ```bash
   npx expo start
   ```

No output, você encontrará opções para abrir o aplicativo em:

- [build de desenvolvimento](https://docs.expo.dev/develop/development-builds/introduction/)
- [emulador Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [simulador iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), um sandbox limitado para experimentar o desenvolvimento de aplicativos com o Expo

Você pode começar a desenvolver editando os arquivos dentro do diretório **src/app**. Este projeto utiliza [roteamento baseado em arquivos](https://docs.expo.dev/router/introduction).

### Outros passos

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Documentação

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
