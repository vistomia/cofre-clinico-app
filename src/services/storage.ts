import * as FileSystem from 'expo-file-system/legacy';

async function garantirDiretorio(caminhoDiretorio: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(caminhoDiretorio);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(caminhoDiretorio, { intermediates: true });
  }
}

export async function salvarFotoPaciente(
  tempUri: string,
  pacienteUid: string
): Promise<string> {
  try {
    const pastaPaciente = `${FileSystem.documentDirectory}pacientes/${pacienteUid}/`;
    await garantirDiretorio(pastaPaciente);

    const nomeArquivo = `lesao_${Date.now()}.jpg`;
    const caminhoFinal = `${pastaPaciente}${nomeArquivo}`;

    await FileSystem.moveAsync({
      from: tempUri,
      to: caminhoFinal,
    });

    return caminhoFinal;
  } catch (error) {
    console.error('Erro ao salvar foto no diretório do paciente:', error);
    throw error;
  }
}

export async function salvarFotoRascunho(tempUri: string): Promise<string> {
  try {
    const pastaRascunhos = `${FileSystem.documentDirectory}rascunhos/`;
    await garantirDiretorio(pastaRascunhos);

    const caminhoRascunho = `${pastaRascunhos}temp_${Date.now()}.jpg`;

    await FileSystem.moveAsync({
      from: tempUri,
      to: caminhoRascunho,
    });

    return caminhoRascunho;
  } catch (error) {
    console.error('Erro ao salvar foto no diretório de rascunhos:', error);
    throw error;
  }
}

export async function vincularRascunhoAoPaciente(
  caminhoRascunho: string,
  pacienteUid: string
): Promise<string> {
  try {
    const pastaPaciente = `${FileSystem.documentDirectory}pacientes/${pacienteUid}/`;
    await garantirDiretorio(pastaPaciente);

    const nomeArquivo = `lesao_${Date.now()}.jpg`;
    const caminhoFinal = `${pastaPaciente}${nomeArquivo}`;

    await FileSystem.moveAsync({
      from: caminhoRascunho,
      to: caminhoFinal,
    });

    return caminhoFinal;
  } catch (error) {
    console.error('Erro ao vincular foto de rascunho ao paciente:', error);
    throw error;
  }
}

export async function eliminarFoto(caminhoArquivo: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(caminhoArquivo);
    if (info.exists) {
      await FileSystem.deleteAsync(caminhoArquivo, { idempotent: true });
    }
  } catch (error) {
    console.error('Erro ao eliminar foto do armazenamento:', error);
    throw error;
  }
}