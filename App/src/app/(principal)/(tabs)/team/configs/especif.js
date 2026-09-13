import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { appContext } from '../../../../../context/appContext'; // Ajuste o caminho
import { FontAwesome } from '@expo/vector-icons';

export default function Especificacoes() {
  const { 
    equipeName, 
    espIp, 
    nomeRascunho, 
    setNomeRascunho, 
    ipRascunho, 
    setIpRascunho, 
    nameError, 
    ipError, 
    handleConfirmar 
  } = useContext(appContext);

  const [openName, setOpenName] = useState(false);
  const [openIp, setOpenIp] = useState(false);

  const [lastName, setLastName] = useState(equipeName);
  const [lastIp, setLastIp] = useState(espIp);

  useEffect(() => {
    if (equipeName) setLastName(equipeName);
    if (espIp) setLastIp(espIp);
  }, [equipeName, espIp]);

  const salvar = async () => {
    await handleConfirmar();
    setLastName(nomeRascunho);
    setLastIp(ipRascunho);
    setOpenName(false);
    setOpenIp(false);
  };

  const temAlteracaoName = openName && nomeRascunho && nomeRascunho !== lastName;
  const temAlteracaoIp = openIp && ipRascunho && ipRascunho !== lastIp;
  const exibeBotaoSalvar = temAlteracaoName || temAlteracaoIp;

  const formattedIpDisplay = espIp ? espIp.replace('http://', '') : 'Não configurado';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Especificações</Text>
      <Text style={styles.description}>
        Altere as informações de identificação da equipe e o endereço IP de conexão do módulo ESP32.
      </Text>

      {/* Seção 1: Nome da Equipe */}
      <Text style={styles.labelSection}>Nome da Equipe</Text>
      <TouchableOpacity 
        style={[styles.botRedefinir, openName && styles.botRedefinirAtivo]} 
        onPress={() => setOpenName(!openName)}
        activeOpacity={0.7}
      >
        <Text style={styles.labelValue}>{equipeName || 'Sem nome'}</Text>
        <FontAwesome 
          name={openName ? "chevron-up" : "chevron-down"} 
          size={14} 
          color="rgba(255, 255, 255, 0.6)" 
        />
      </TouchableOpacity>
      
      {openName && (
        <View style={styles.inputContainer}>
          <TextInput 
            style={[styles.input, nameError ? styles.inputError : null]}
            placeholder='Digite o novo nome'
            placeholderTextColor='rgba(255, 255, 255, 0.4)'
            value={nomeRascunho}
            onChangeText={setNomeRascunho}
          />
          {nameError && <Text style={styles.errorText}>Nome inválido ou indisponível.</Text>}
        </View>
      )}

      {/* Seção 2: Endereço IP do ESP32 */}
      <Text style={styles.labelSection}>Endereço IP (ESP32)</Text>
      <TouchableOpacity 
        style={[styles.botRedefinir, openIp && styles.botRedefinirAtivo]} 
        onPress={() => setOpenIp(!openIp)}
        activeOpacity={0.7}
      >
        <Text style={styles.labelValue}>{formattedIpDisplay}</Text>
        <FontAwesome 
          name={openIp ? "chevron-up" : "chevron-down"} 
          size={14} 
          color="rgba(255, 255, 255, 0.6)" 
        />
      </TouchableOpacity>
      
      {openIp && (
        <View style={styles.inputContainer}>
          <TextInput 
            style={[styles.input, ipError ? styles.inputError : null]}
            placeholder='Ex: 192.168.1.50'
            placeholderTextColor='rgba(255, 255, 255, 0.4)'
            keyboardType='numeric'
            value={ipRascunho}
            onChangeText={setIpRascunho}
          />
          {ipError && <Text style={styles.errorText}>Endereço IP inválido.</Text>}
        </View>
      )}

      {exibeBotaoSalvar && (
        <TouchableOpacity style={styles.btnSave} onPress={salvar} activeOpacity={0.8}>
          <Text style={styles.btnSaveText}>Salvar Alterações</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'rgb(27, 34, 44)', 
    paddingHorizontal: 20, 
    paddingTop: 60 
  },
  pageTitle: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  description: { 
    color: 'rgba(255, 255, 255, 0.6)', 
    fontSize: 14, 
    lineHeight: 20, 
    marginBottom: 25 
  },
  labelSection: { 
    fontSize: 14, 
    color: 'rgba(255, 255, 255, 0.6)', 
    textTransform: 'uppercase', 
    fontWeight: '600', 
    marginBottom: 10 
  },

  botRedefinir: { 
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgb(62, 69, 80)', 
    borderRadius: 12, 
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    marginBottom: 12 
  },
  botRedefinirAtivo: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: 'rgb(72, 80, 92)',
    marginBottom: 0
  },
  labelValue: { 
    fontSize: 16, 
    color: 'white', 
    fontWeight: '500' 
  },

  inputContainer: {
    backgroundColor: 'rgb(50, 56, 66)',
    padding: 14,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 20,
  },
  input: { 
    backgroundColor: 'rgb(62, 69, 80)', 
    color: 'white', 
    fontSize: 16, 
    borderRadius: 8, 
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  inputError: {
    borderColor: '#ff4444'
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4
  },

  btnSave: { 
    backgroundColor: 'rgb(0, 153, 82)', 
    paddingVertical: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 15, 
    marginBottom: 40 
  },
  btnSaveText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});