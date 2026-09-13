import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import React, { useState, useContext } from 'react';
import { appContext } from '../../../../context/appContext';
import { FontAwesome } from '@expo/vector-icons'; 

const hierarchy = {
  'visitante': 1,
  'membro': 2,
  'operador': 3,
  'co-administrador': 4,
  'administrador': 5
};

const hasPermission = (cargoDoUser, requiredLevel) => {
  const userLevel = hierarchy[cargoDoUser] || 0;
  let minimumLevelRequired;
  
  switch(requiredLevel) {
    case 1: minimumLevelRequired = 5; break;
    case 2: minimumLevelRequired = 1; break; 
    case 3: minimumLevelRequired = 1; break; 
    case 4: minimumLevelRequired = 2; break;
    case 5: minimumLevelRequired = 3; break; 
    default: minimumLevelRequired = 5; 
  }

  return userLevel >= minimumLevelRequired;
};

export default function History() {
  const { historico, myEquip, equipConfig } = useContext(appContext);
  
  const [atualRev, setAtualRev] = useState(true);
  const [filtro, setFiltro] = useState('');   
  const [filtroA, setFiltroA] = useState(false);   
  const [equipFilter, setEquipFilter] = useState(false)
  const [selectedEquip, setSelectedEquip] = useState('Todos')

  const cargoAtual = myEquip && myEquip.length > 0 ? myEquip[0].cargo : null;
  const regraHistorico = equipConfig?.historico || 1; 
  const canViewHistory = hasPermission(cargoAtual, regraHistorico);

  const obterDadosFiltrados = () => {
    let resultado = [...historico];

    if (filtro === 'off') {
      resultado = resultado.filter(item => item.descricao === 'LED Desligado')
    } else if (filtro === 'on') {
      resultado = resultado.filter(item => item.descricao === 'LED Ligado')
    }

    if (selectedEquip !== 'Todos') {
      const equipe = myEquip.find(item => item.equipe === selectedEquip)
      if (equipe) {
        resultado = resultado.filter(item => item.equipid === equipe.id);
      } else {
        return [];
      }
    }

    return resultado
  }

  const dadosFiltrados = obterDadosFiltrados()
  const dadosReais = atualRev ? dadosFiltrados : [...dadosFiltrados].reverse()

  const butEquipe = (equipe, posicao) => {
    const isActive = selectedEquip === equipe
    
    let borderStyles = {};
    if (!isActive) {
      if (posicao === 'primeiro') {
        borderStyles = {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
      } else if (posicao === 'ultimo') {
        borderStyles = {
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        };
      } else {
        borderStyles = {
          borderRadius: 0,
        };
      }
    } else {
      borderStyles = {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }
    }

    return {
      backgroundColor: isActive ? '#22a579' : '#E5E5EA',
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginHorizontal: 4,
      minWidth: 70,
      alignItems: 'center',
      ...borderStyles,
    }
  }

  const textEquipe = (equipe) => {
    const isActive = selectedEquip === equipe
    return {
      color: isActive ? '#FFFFFF' : '#3A3A3C',
      fontWeight: '600',
      fontSize: 14,
    }
  }

  const butConfig = (stats) => {
    const isActive = (stats === 'reverse' && atualRev) || (filtro === stats) || (stats === 'normal' && filtro === '');
    return {
      backgroundColor: isActive ? '#007AFF' : '#E5E5EA',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginHorizontal: 4,
      minWidth: 70,
      alignItems: 'center',
    };
  };

  const textConfig = (stats) => {
    const isActive = (stats === 'reverse' && atualRev) || (filtro === stats) || (stats === 'normal' && filtro === '');
    return {
      color: isActive ? '#FFFFFF' : '#3A3A3C',
      fontWeight: '600',
      fontSize: 14,
    };
  };

  if (!canViewHistory) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }]}>
        <FontAwesome name="lock" size={60} color="#8E8E93" style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 10 }}>
          Acesso Negado
        </Text>
        <Text style={{ fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22 }}>
          O seu cargo atual ({cargoAtual ? cargoAtual.toUpperCase() : 'NENHUM'}) não possui permissão para visualizar o histórico desta equipe.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico ({selectedEquip})</Text>
        <TouchableOpacity style={styles.filterMenuButton} onPress={() => setFiltroA(true)}>
          <Text style={styles.filterMenuButtonText}>Filtros</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={filtroA} transparent={true} animationType="fade" onRequestClose={() => setFiltroA(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setFiltroA(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar Histórico</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setFiltroA(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Equipe Selecionada</Text>
            <TouchableOpacity style={{ backgroundColor: '#22a579', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginHorizontal: 4, minWidth: 70, alignItems: 'center', marginBottom: equipFilter ? 7 : 15 }} onPress={() => setEquipFilter(!equipFilter)}>
              <Text style={{ color: 'white' }}>{selectedEquip}</Text>
            </TouchableOpacity>

            {equipFilter && (
              myEquip.map((item, index) => {
                const posicao = index === 0 ? 'primeiro' : 'meio';
                
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={butEquipe(item.equipe, posicao)} 
                    onPress={() => { setSelectedEquip(item.equipe); setEquipFilter(false); }}
                  >
                    <Text style={textEquipe(item.equipe)}>{item.equipe}</Text>
                  </TouchableOpacity>
                )
              })
            )}
            
            {equipFilter && (
              <TouchableOpacity 
                style={butEquipe('Todos', 'ultimo')} 
                onPress={() => { setSelectedEquip('Todos'); setEquipFilter(false); }}
              >
                <Text style={textEquipe('Todos')}>Todos</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionLabel, { marginTop: 15 }]}>Ordenação</Text>
            <TouchableOpacity style={butConfig('reverse')} onPress={() => setAtualRev(!atualRev)}>
              <Text style={textConfig('reverse')}>{atualRev ? "Mais Recentes" : "Mais Antigos"}</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, { marginTop: 15 }]}>Status do LED</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity style={butConfig('normal')} onPress={() => setFiltro('')}>
                <Text style={textConfig('normal')}>Todos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={butConfig('off')} onPress={() => setFiltro('off')}>
                <Text style={textConfig('off')}>Off's</Text>
              </TouchableOpacity>

              <TouchableOpacity style={butConfig('on')} onPress={() => setFiltro('on')}>
                <Text style={textConfig('on')}>On's</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.tableHeader}>
        <Text style={[styles.columnHeader, { flex: 2.5 }]}>Ação</Text>
        <Text style={[styles.columnHeader, { flex: 1.5 }]}>Data</Text>
        <Text style={[styles.columnHeader, { flex: 1.5 }]}>Origem</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        {dadosReais.map((item, index) => (
          <TouchableOpacity key={item.id} activeOpacity={0.7}>
            <View 
              style={[
                styles.tableRow, 
                { backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#f3f3f3' }
              ]}
            >
              <View style={{ flex: 2.5, paddingRight: 4 }}>
                <Text style={styles.textDescricao}>{item.descricao}</Text>
              </View>

              <View style={{ flex: 1.5 }}>
                <Text style={styles.textMeta}>{item.dia}</Text>
                <Text style={styles.textSubMeta}>{item.hora}</Text>
              </View>

              <View style={{ flex: 1.5 }}>
                <Text style={styles.textMeta} numberOfLines={1}>{item.por || 'Sistema'}</Text>
                <Text style={styles.textSubMeta} numberOfLines={1}>{item.tipo}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {dadosReais.length === 0 && (
          <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  filterMenuButton: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterMenuButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#771919',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ebebee',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10108d',
  },
  scrollContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  textDescricao: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  textMeta: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3A3A3C',
  },
  textSubMeta: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 40,
    fontSize: 15,
  }
});