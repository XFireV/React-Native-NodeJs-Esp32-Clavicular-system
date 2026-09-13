import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { appContext } from '../../../../../context/appContext'; // Ajuste o caminho
import { FontAwesome } from '@expo/vector-icons';

export default function Funcionalidades() {
  const { 
    inviteDados, 
    inviteRascunho, 
    setInviteRascunho, 
    cargos, 
    handleConfirmar,
    equipConfig
  } = useContext(appContext);
  
  const [personInvite, setPersonInvite] = useState(null);

  const [lastInvite, setLastInvite] = useState(null);
  const [lastPersonInvite, setLastPersonInvite] = useState(null);

  useEffect(() => {
    if (equipConfig && lastInvite === null) {
      const conviteDB = equipConfig.invite; 

      if (conviteDB === 4 || conviteDB === 0) {
        setInviteRascunho(conviteDB);
        setLastInvite(conviteDB);
      } else {
        setInviteRascunho(null);
        setLastInvite(null);
        
        setPersonInvite(conviteDB);
        setLastPersonInvite(conviteDB);
      }
    }
  }, [equipConfig]);

  const salvar = async () => {
    await handleConfirmar();
    
    setLastInvite(inviteRascunho);
    setLastPersonInvite(personInvite);
  };

  const temAlteracaoInvite = lastInvite !== inviteRascunho;
  const temAlteracaoCargo = inviteRascunho === null && lastPersonInvite !== personInvite;
  const exibeBotaoSalvar = temAlteracaoInvite || temAlteracaoCargo;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Funcionalidades</Text>

      <Text style={styles.labelSection}>Quem pode convidar?</Text>
      
      <View style={styles.containerBotoes}>
        {inviteDados && inviteDados.map((item) => {
          const selected = inviteRascunho === item.value;
          return (
            <TouchableOpacity 
              key={item.label} 
              style={[styles.btnOpcao, selected && styles.btnOpcaoSelecionado]}
              onPress={() => setInviteRascunho(item.value)}
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
        })}
      </View>

      {inviteRascunho === null && (
        <View style={styles.containerCargos}>
          <Text style={styles.labelSubSection}>Selecione os cargos permitidos:</Text>
          {cargos && cargos.map((item, index) => {
            const selected = index === personInvite;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.radioOption} 
                onPress={() => setPersonInvite(index)}
                activeOpacity={0.7}
              >
                <FontAwesome 
                  name={selected ? "check-square" : "square-o"} 
                  size={20} 
                  color={selected ? 'rgb(0, 153, 82)' : 'white'} 
                  style={{ marginRight: 12 }} 
                />
                <Text style={{ color: selected ? 'rgb(24, 255, 147)' : 'white', fontSize: 16 }}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {exibeBotaoSalvar && (
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
    marginBottom: 25 
  },
  labelSection: { 
    fontSize: 14, 
    color: 'rgba(255, 255, 255, 0.6)', 
    textTransform: 'uppercase', 
    fontWeight: '600', 
    marginBottom: 12 
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

  containerCargos: { 
    marginBottom: 25, 
    paddingLeft: 4 
  },
  labelSubSection: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 15 
  },
  radioOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14 
  },

  btnSave: { 
    backgroundColor: 'rgb(0, 153, 82)', 
    paddingVertical: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 40 
  },
  btnSaveText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});