import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';

export default function Jogo() {
    const [vidaM, setVidaM] = useState(0);
    const [intactMLife, setIntactMLife] = useState(0);
    const [damageBase, setDamageBase] = useState(4); 
    const [exp, setExp] = useState(0);

    const setMonsterStatus = () => {
        const life = Math.floor(50 + Math.random() * 20);
        setVidaM(life);
        setIntactMLife(life);
    };

    const giveDamage = () => {
        // Trava de segurança: impede de atacar se o monstro já estiver morto
        if (vidaM <= 0) return; 

        setVidaM((vidaAnterior) => {
            const novaVida = vidaAnterior - damageBase;
            
            if (novaVida <= 0) {
                expSpoils();
                return 0; // Trava a vida em 0 para não ficar negativa
            }
            return novaVida;
        });
    };

    const expSpoils = () => {
        // Garantimos pelo menos 1 de XP (+1) para não haver combates frustrantes dando 0 de XP
        const expGanha = Math.floor(Math.random() * intactMLife) + 1;
        
        // Forma segura de atualizar estado baseado no valor anterior
        setExp((expAtual) => expAtual + expGanha);
    };

    // Variável derivada para facilitar a leitura do JSX
    const monstroEstaVivo = vidaM > 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.exp}>Exp: {exp}</Text>
            </View>
            
            <View style={styles.arena}>
                {monstroEstaVivo ? (
                    // Se o monstro estiver vivo, mostra a vida e o botão de ataque
                    <>
                        <Text style={styles.textVidaM}>HP Inimigo: {vidaM} / {intactMLife}</Text>
                        <Pressable style={styles.attack} onPress={giveDamage}>
                            <Text style={styles.textAttack}>Attack</Text>
                        </Pressable>
                    </>
                ) : (
                    // Se estiver morto (ou no início do jogo), mostra apenas o botão de procurar
                    <TouchableOpacity style={styles.search} onPress={setMonsterStatus}>
                        <Text style={styles.textSearch}>
                            {intactMLife === 0 ? "Começar Aventura" : "Procurar Monstro"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: 'rgb(17, 31, 58)' 
    },
    header: { 
        flex: 0.2, // Usa proporção em vez de apenas alinhar ao topo
        justifyContent: 'flex-end',
        paddingHorizontal: 20
    },
    arena: { 
        flex: 0.8, 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 20 // Adiciona espaçamento automático entre os elementos da arena
    },
    exp: { 
        fontSize: 24, 
        color: 'rgb(0, 231, 220)',
        fontWeight: 'bold'
    },
    textVidaM: { 
        color: '#ff4444', // Um vermelho faz mais sentido para HP inimigo
        fontSize: 22,
        fontWeight: 'bold'
    },
    attack: { 
        paddingVertical: 15, 
        paddingHorizontal: 40,
        backgroundColor: 'rgb(226, 255, 120)', 
        borderRadius: 12,
        elevation: 5, // Sombra no Android
        shadowColor: '#000', // Sombra no iOS
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    textAttack: { 
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333'
    },
    search: { 
        backgroundColor: 'rgb(68, 156, 134)', 
        borderRadius: 10, 
        paddingVertical: 12,
        paddingHorizontal: 30
    },
    textSearch: { 
        color: 'white', 
        fontSize: 24,
        fontWeight: 'bold'
    },
});