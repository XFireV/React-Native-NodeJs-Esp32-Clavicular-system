import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { appContext } from '../../../../../context/appContext'; // Ajuste o caminho se necessário
import { FontAwesome } from '@expo/vector-icons';

export default function Acesso() {
  const { 
    equipServer, 
    serverRascunho, 
    setServerRascunho, 
    equipType, 
    equipTypeRascunho, 
    setEquipTypeRascunho, 
    handleConfirmar,
    equipConfig,
    historicoRascunho,
    setHistoricoRascunho,
    ativacaoRascunho,
    setAtivacaoRascunho,
    tempoRascunho,
    setTempoRascunho
  } = useContext(appContext);

  const [lastEntrada, setLastEntrada] = useState(null);
  const [lastServer, setLastServer] = useState(null);
  const [lastHistorico, setLastHistorico] = useState(null);
  const [lastAtivacao, setLastAtivacao] = useState(null);
  const [lastTempo, setLastTempo] = useState(null);

  const opcoesAcesso = [
    { label: 'Apenas Eu', value: 1 },
    { label: 'Todos da Equipe', value: 2 },
    { label: 'Visitantes p/ cima', value: 3 },
    { label: 'Membros p/ cima', value: 4 },
    { label: 'Operadores p/ cima', value: 5 }
  ];

  useEffect(() => {
    if (equipConfig) {

      if (lastEntrada === null) {
        setEquipTypeRascunho(equipConfig.enter);
        setLastEntrada(equipConfig.enter);
      }
      if (lastServer === null) {
        setServerRascunho(equipConfig.server ? 1 : 2); 
        setLastServer(equipConfig.server ? 1 : 2);
      }
      if (lastHistorico === null) {
        setHistoricoRascunho(equipConfig.historico || 1);
        setLastHistorico(equipConfig.historico || 1);
      }
      if (lastAtivacao === null) {
        setAtivacaoRascunho(equipConfig.ativation || 1);
        setLastAtivacao(equipConfig.ativation || 1);
      }
      if (lastTempo === null) {
        setTempoRascunho(equipConfig.opentime || 10);
        setLastTempo(equipConfig.opentime || 10);
      }
    }
  }, [equipConfig]);

  const alterarTempo = (valor) => {
    const novoTempo = (tempoRascunho || 10) + valor;
    if (novoTempo >= 10) {
      setTempoRascunho(novoTempo);
    }
  };

  const salvar = async () => {
    await handleConfirmar(); 
    
    setLastEntrada(equipTypeRascunho);
    setLastServer(serverRascunho);
    setLastHistorico(historicoRascunho);
    setLastAtivacao(ativacaoRascunho);
    setLastTempo(tempoRascunho);
  };

  const temAlteracao = 
    lastEntrada !== equipTypeRascunho || 
    lastServer !== serverRascunho ||
    lastHistorico !== historicoRascunho ||
    lastAtivacao !== ativacaoRascunho ||
    lastTempo !== tempoRascunho;

  const renderOpcoes = (dados, valorAtual, setValorAtual) => {
    return dados.map((item) => {
      const selected = valorAtual === item.value;
      return (
        <TouchableOpacity 
          key={item.value} 
          style={[styles.btnOpcao, selected && styles.btnOpcaoSelecionado]}
          onPress={() => setValorAtual(item.value)}
          activeOpacity={0.7}
        >
          <FontAwesome 
            name={selected ? "dot-circle-o" : "circle-o"} 
            size={18} 
            color={selected ? 'rgb(24, 255, 147)' : 'rgba(255, 255, 255, 0.5)'} 
            style={styles.iconOpcao}
          />
          <Text style={[styles.textoOpcao, selected && styles.textoOpcaoSelecionado]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Acesso da Equipe</Text>
      <Text style={styles.description}>
        Gerencie as permissões e configurações operacionais do dispositivo para esta equipe.
      </Text>

      {/* Seção 1: Servidor */}
      <Text style={styles.labelSection}>Servidor</Text>
      <View style={styles.containerBotoes}>
        {equipServer && renderOpcoes(equipServer, serverRascunho, setServerRascunho)}
      </View>

      {/* Seção 2: Tipo de Entrada */}
      <Text style={styles.labelSection}>Entrada</Text>
      <View style={styles.containerBotoes}>
        {equipType && renderOpcoes(equipType, equipTypeRascunho, setEquipTypeRascunho)}
      </View>

      {/* Seção 3: Acesso ao Histórico */}
      <Text style={styles.labelSection}>Visualização do Histórico</Text>
      <View style={styles.containerBotoes}>
        {renderOpcoes(opcoesAcesso, historicoRascunho, setHistoricoRascunho)}
      </View>

      {/* Seção 4: Permissão de Ativação (ESP32) */}
      <Text style={styles.labelSection}>Permissão para Ativar (ESP32)</Text>
      <View style={styles.containerBotoes}>
        {renderOpcoes(opcoesAcesso, ativacaoRascunho, setAtivacaoRascunho)}
      </View>

      {/* Seção 5: Tempo de Ativação */}
      <Text style={styles.labelSection}>Tempo de Ativação (Segundos)</Text>
      <View style={[styles.containerBotoes, styles.containerTimer]}>
        <Text style={styles.timerDescricao}>
          Tempo que o relé permanecerá ativo após receber o comando.
        </Text>
        
        <View style={styles.timerControles}>
          <TouchableOpacity 
            style={styles.btnTimer} 
            onPress={() => alterarTempo(-1)}
            disabled={tempoRascunho <= 10} 
            activeOpacity={0.7}
          >
            <FontAwesome name="minus" size={16} color={tempoRascunho <= 10 ? 'rgba(255,255,255,0.2)' : 'white'} />
          </TouchableOpacity>

          <View style={styles.displayTimer}>
            <Text style={styles.textoTimer}>{tempoRascunho || 10}s</Text>
          </View>

          <TouchableOpacity 
            style={styles.btnTimer} 
            onPress={() => alterarTempo(1)}
            activeOpacity={0.7}
          >
            <FontAwesome name="plus" size={16} color="white" />
          </TouchableOpacity>
        </View>
        {tempoRascunho <= 10 && (
          <Text style={styles.alertaTempo}>O tempo mínimo permitido é 10 segundos.</Text>
        )}
      </View>

      {temAlteracao && (
        <TouchableOpacity style={styles.btnSave} onPress={salvar} activeOpacity={0.8}>
          <Text style={styles.btnSaveText}>Salvar Configurações</Text>
        </TouchableOpacity>
      )}
      
      <View style={{ height: 40 }} /> 
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

  containerBotoes: { 
    backgroundColor: 'rgb(62, 69, 80)', 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginBottom: 25 
  },
  btnOpcao: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255, 255, 255, 0.06)' 
  },
  btnOpcaoSelecionado: { 
    backgroundColor: 'rgba(0, 153, 82, 0.18)' 
  },
  iconOpcao: { 
    marginRight: 12 
  },
  textoOpcao: { 
    fontSize: 16, 
    color: 'rgba(255, 255, 255, 0.8)' 
  },
  textoOpcaoSelecionado: { 
    color: 'white', 
    fontWeight: 'bold' 
  },

  containerTimer: {
    padding: 16,
  },
  timerDescricao: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginBottom: 15,
  },
  timerControles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 5,
  },
  btnTimer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayTimer: {
    flex: 1,
    alignItems: 'center',
  },
  textoTimer: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  alertaTempo: {
    color: 'rgba(255, 100, 100, 0.8)',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },

  btnSave: { 
    backgroundColor: 'rgb(0, 153, 82)', 
    paddingVertical: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 20 
  },
  btnSaveText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});