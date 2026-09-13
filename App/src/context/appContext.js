import { createContext, useState, useEffect, createRef } from 'react';
import { supabase } from '../supaBase/supa';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRouter } from 'expo-router';
export const appContext = createContext();
import emailjs from '@emailjs/browser';

export function AppProvider({ children }) {
    const [valorInviteDados, setValorInviteDados] = useState(null)
    const [valorSever, setValorServer] = useState(null)
    const [valorIp, setValorIp] = useState('')
    const [logged, setLogged] = useState(false);
    const [historico, setHistorico] = useState([]);
    const [confirmCred, setConfirmCred] = useState(false)
    const [alreadyRegistred, setAlreadyRegistred] = useState(false)
    const [firstLog, setFirstLog] = useState(false)
    const [senhaA, setSenhaA] = useState(false)
    const [smallPass, setSmallPass] = useState(false)
    const [userCheck, setUserCheck] = useState(true)
    const [emailCheck, setEmailCheck] = useState(true)
    const [espIp, setEspIp] = useState('http://'); 
    const [valid, setValid] = useState(false)
    const [loginErro, setloginErro] = useState(false)
    const [loginSave, setLoginSave] = useState(false)
    const [authForm, setAuthForm] = useState('')
    const [creatingEquip, setCreatingEquip] = useState(false)
    const [ipLocal, setIpLocal] = useState(false)
    const [equipName, setEquipName] = useState('')
    const [atualUserId, setAtualUserId] = useState('')
    const [equipId, setEquipId] = useState('')
    const [allEquips, setAllEquips] = useState([])
    const [myEquip, setMyEquip] = useState([])
    const [users, setUsers] = useState([])
    const [shareIp, setShareIp] = useState('')
    const [userId, setUserId] = useState('')
    const [userEquips, setUserEquips] = useState([])
    const [userEmail, setUserEmail] = useState('')
    const [myIps, setMyIps] = useState([])
    const [equipAtualId, setEquipAtualId] = useState('')
    const [pessoalIp, setPessoalIp] = useState('')
    const [notif, setNotif] = useState([])
    const [ipError, setIpError] = useState(null)
    const [nameError, setNameError] = useState(null)
    const [equipeName, setEquipeName] = useState('')
    const [ipRascunho, setIpRascunho] = useState('')
    const [nomeRascunho, setNomeRascunho] = useState('')
    const [inviteRascunho, setInviteRascunho] = useState('')
    const [serverRascunho, setServerRascunho] = useState('')
    const [equipConfig, setEquipConfig] = useState([])
    const [solicitacoesEquipe, setSolicitacoesEquipe] = useState([]);
    const [exp, setExp] = useState(null)
    const [pedidosEnviados, setPedidosEnviados] = useState([])
    const [pedidosRecebidos, setPedidosRecebidos] = useState([])
    const [amigosIds, setAmigosIds] = useState([]);
    const [userReferenceEquips, setUserReferenceEquips] = useState([])
    const [enterEquip, setEnterEquip] = useState(null)
    const [opacityActive, setOpacityActive] = useState(false)
    const [equipTypeRascunho, setEquipTypeRascunho] = useState(null)
    const [historicoRascunho, setHistoricoRascunho] = useState(null)
    const [ativacaoRascunho, setAtivacaoRascunho] = useState(null)
    const [tempoRascunho, setTempoRascunho] = useState(null)

    const [ldr, setLdr] = useState({
    l1: false, l2: false, l3: false, l4: false, l5: false,
    l6: false, l7: false, l8: false, l9: false, l10: false
});

    const cargos= ['visitante', 'membro', 'operador', 'co-administrador', 'administrador']

    const [loginCredentials, setLoginCredentials] = useState({
        usuarioL: '',
        senhaL: ''
    })
    const [signCredentials, setSignCredentials] = useState({
        usuarioS: '',
        emailS: '',
        senhaS: ''
    })

    const inviteDados = [
        {label : 'Eu', value: 4},
        {label : 'Personalizado', value: null},
        {label : 'Todos', value: 0}
    ]

    const equipServer = [
        {label: 'Público', value: 1},
        {label: 'Privado', value: 2}
    ]

    const equipType = [
        {label: 'Público', value: 1},
        {label: 'Privado', value: 2}
    ]

    const { usuarioL } = loginCredentials

    const credentialChange = (cred, newValue, type) => { 
        if (type === 'login') {
            setLoginCredentials(prev => ({ ...prev, [cred]: newValue }));
            setloginErro(false);
        } else if (type === 'signin') {
            setSignCredentials(prev => ({ ...prev, [cred]: newValue }));
        
            if (cred === 'senhaS') setSmallPass(false);
            if (cred === 'emailS') setEmailCheck(true);
            if (cred === 'usuarioS') setUserCheck(true);
        }
    }

    const [id, setId] = useState('')

    const serviceId = 'service_4g7uaee';
    const templateId = 'template_qiweqgi';
    const publicKey = 'h_1N863Lrqk8PxcHI'

    const errorClean = () => {
        setloginErro(false)
        setSmallPass(false)
        setEmailCheck(true)
        setUserCheck(true)
        setAlreadyRegistred('')
    }

const handleConfirmar = async (espMudou, personInviteCustom = null) => {
    let inviteFinal;
    if (inviteRascunho !== null && inviteRascunho !== '') {
        inviteFinal = inviteRascunho;
    } else if (inviteRascunho === null && personInviteCustom !== null) {
        inviteFinal = personInviteCustom;
    } else {
        inviteFinal = equipConfig?.invite;
    }

    const nomeFinal = nomeRascunho.trim() === '' ? equipeName : nomeRascunho;
    const ipFinal = ipRascunho.trim() === '' ? espIp.replace("http://", "") : ipRascunho;
    const serverFinal = serverRascunho === 1 ? true : false;
    
    const entradaFinal = equipTypeRascunho !== null ? equipTypeRascunho : equipConfig?.enter;
    const historicoFinal = historicoRascunho !== null ? historicoRascunho : equipConfig?.historico;
    const ativacaoFinal = ativacaoRascunho !== null ? ativacaoRascunho : equipConfig?.ativation;
    const tempoFinal = tempoRascunho !== null ? tempoRascunho : equipConfig?.opentime;

    const nadaMudou = 
        nomeFinal === equipeName && 
        ipFinal === espIp.replace("http://", "") && 
        inviteFinal === equipConfig?.invite && 
        serverFinal === equipConfig?.server &&
        entradaFinal === equipConfig?.enter &&
        historicoFinal === equipConfig?.historico &&
        ativacaoFinal === equipConfig?.ativation &&
        tempoFinal === equipConfig?.opentime;

    if (nadaMudou) {
        Alert.alert("Aviso", "Nenhuma alteração foi feita.");
        return;
    }

    const { hasError, mac } = await checkEquipNetwork(nomeFinal, ipFinal, espMudou);

    if (hasError) {
        Alert.alert("Erro de Conexão", "Não foi possível validar o ESP32 na rede.");
        return;
    }

    const sucesso = await saveSettings(
        nomeFinal, ipFinal, inviteFinal, serverFinal, mac,
        entradaFinal, historicoFinal, ativacaoFinal, tempoFinal
    );
    
    if (sucesso) router.back();
};

    const activeLoginSave = async() => {
        const { senhaL, usuarioL} = loginCredentials
        const newLoginSave = !loginSave
        setLoginSave(newLoginSave)
        await AsyncStorage.setItem('loginSave', JSON.stringify(newLoginSave))
        if (newLoginSave) {
                await AsyncStorage.multiSet([['@logSenha', senhaL], ['@logUser', usuarioL]]);
            } else {
                await AsyncStorage.multiRemove(['@logSenha', '@logUser']);
            }
        }

    useEffect(() => {
    if (!logged || !userId) return;

    const ipReal = espIp.replace('http://', '').trim()

    const carregarTudo = async () => {
        await Promise.all([
            fetchInitialData(),
            myEquips(),
            takeLdr(),
            setPublicEquip(),
            setAlertas(),
            awaitedFriendRequests(),
            carregarPedidos()
        ]);
    };
    carregarTudo();

    const canalGlobal = supabase
        .channel('sync-geral')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'historico' 
        }, () => fetchInitialData())
        
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'userequips', 
            filter: `userid=eq.${userId}` 
        }, () => { 
            myEquips();
            equipPage();
        })
        
        .on('postgres_changes', { 
            event: '*',
            schema: 'public', 
            table: 'equipes' 
        }, () => {
            setPublicEquip();
            myEquips(); 
        })
        .on('postgres_changes',{
            event: 'UPDATE', 
            schema: 'public',
            table: 'IPs',
            filter: `ip=eq.${ipReal}`
        }, (payload) => {
            confirmAtualUsage()
            console.log('Dados recebidos em Tempo Real:', payload.new.ldr);
            setLdr(payload.new.ldr);
        })
        .subscribe()

    return () => {
        supabase.removeChannel(canalGlobal);
    };
}, [logged, espIp]);

    useEffect(() => {
        const isSaveLogin = async() => {
            const atualLoginSave = await AsyncStorage.getItem('loginSave')
            if (atualLoginSave != null && atualLoginSave != 'false') {
                const isSaved = true
                setLoginSave(isSaved)
                const newPass = await AsyncStorage.getItem('@logSenha')
                const newUser = await AsyncStorage.getItem('@logUser')
                if (newUser && newPass) {
                    setLoginCredentials({ usuarioL: newUser, senhaL: newPass })
            }
        }
    }
    isSaveLogin()
}, [])

    const checkEquipNetwork = async (equipe, ip, espMudou) => {
        let erros = {
            nome: equipe.trim().length < 5 || equipe.trim().length > 15,
            ipInv: false,
        };
        let macRecebido = null;

        if (!espMudou) {
            try {
                const control = new AbortController();
                const timer = setTimeout(() => control.abort(), 4000);

                const response = await fetch(`http://${ip}/parear`, { signal: control.signal });
                clearTimeout(timer)
                
                if (!response.ok) {
                    erros.ipInv = true;
                    return { hasError: true, mac: null };
                } else {
                    macRecebido = await response.text();
                }
            } catch (error) {
                erros.ipInv = true;
                return { hasError: true, mac: null };
            }
        } 

        setIpError(erros.ipInv);
        setNameError(erros.nome);

        return { 
            hasError: Object.values(erros).some(Boolean), 
            mac: macRecebido,
        };
    }

    const analisarErros = (user, senha, email) => {
    const erros = {
        pass: senha.length < 6,
        user: user.trim().length < 3,
        email: !email || !email.includes('@')
    };

    setSmallPass(erros.pass);
    setUserCheck(!erros.user);
    setEmailCheck(!erros.email);

    return !Object.values(erros).some(Boolean); 
}

    const saveSettings = async(nome, ip, invite, server, mac, entrada, historico, ativacao, tempo) => { 
        try {
            const { error } = await supabase
                .from('equipes')
                .update({ 
                    equipe: nome, 
                    convite: invite, 
                    servidor: server, 
                    mac: mac,
                    entrada: entrada,         
                    historico: historico,      
                    ativacao: ativacao,        
                    opentime: tempo            
                }) 
                .eq('id', equipAtualId);

            if (error) throw error;
            
            await supabase.from('IPs').update({ ip: ip }).eq('mac', mac);

            Alert.alert("Sucesso", "Configurações atualizadas!");
            
            await myEquips()
            return true;
            
        } catch(e) {
            Alert.alert("Erro ao salvar", e.message);
            return false;
        }
    }

    const localIp = async(newIp) => {
    try {
      const response = await fetch(`http://${newIp}/parear`);
      const macRecebido = await response.text(); 

      const {data, error} = await supabase
      .from('usuarios')
      .update({ mac: macRecebido }) 
      .select('user')
      .eq('user', usuarioL)

      if (error) throw(error)

      setNewIp(false)
      setPessoalIp(newIp)
      Alert.alert('Sucesso', 'Dispositivo pareado com sucesso!');
    } catch (e) { 
        Alert.alert('Erro', 'Não foi possível parear com o ESP32. Verifique o IP.');
    }
  }

    const addHistory = async (acao, equipe) => {
        try {
            const { error } = await supabase
                .from('historico')
                .insert([{ descricao: acao, user: usuarioL, equipid: equipe, from: 'digital' }]);
            if (error) throw error;
            console.log("Salvo no Supabase!");
        } catch (e) {
            console.error("Erro ao salvar:", e.message);
        }
    };

    const redefinirPass = async(valor) => {
        try {const { error} = await supabase
            .from('usuarios')
            .update({senha: valor})
            .select('senha')
            .eq('user', usuarioL)

            if (error) {
                Alert.alert(error.message);
                return false
            }
            setSenhaA(false)
            logout()
            Alert.alert('Senha alterada')
            return true
    }
    catch(erro) {
        Alert.alert(erro)
        return false 
    }
}

    const logout = async () => {
    try {
    if (!loginSave) {
        errorClean()
    }
    setLogged(false)
    router.replace('/login')
    }
    catch (e) {
      console.error('erro ao ', e)
    }
  }

    const credentialsExist = async(Email, User) => {
        try {
            const {data: existEmail, error: erro} = await supabase
                .from('usuarios')
                .select('email')
                .eq('email', Email)

                if (erro) throw(erro)

                if (existEmail && existEmail.length > 0) {
                    setAlreadyRegistred(true)
                    return false
                } else {console.log('Email não setado')}

            const {data: existUser, error: erroU} = await supabase
                .from('usuarios')
                .select('user')
                .eq('user', User)

                if (erroU) throw(erroU)

                if (existUser && existUser.length > 0) {
                    return false
                } else {return true}

        } catch(e) {
            Alert.alert('Erro ao tentar conexão, tente novamente')
            return false
        }
    }

    const saveCredentials = async (Email, User, Senha) => {
        const { error } = await supabase
            .from('usuarios')
            .insert([{ 
                email: Email,
                user: User,
                senha: Senha 
            }]);
        if (error) throw error;
        console.log("Salvo no Supabase!");
        return true
    }


    const confirmPass = async (user, senha) => {
        const justUser = user.trim();
        const justPass = senha.trim();

        try {
            const { data, error } = await supabase
              .from('usuarios')
              .select(`
                user, senha, id, email, mac,
                IPs ( ip )
              `)
              .eq('user', justUser)
              .single(); 

            if (error) {
              console.log("Erro do Supabase na busca:", error.message, error.details);
              return false;
            }

            if (!data) {
              console.log("Usuário não encontrado no banco.");
              return false;
            }

            if (justPass === data.senha) {
              setUserId(data.id);
              setUserEmail(data.email);
              
              const ipEsp = data.IPs?.ip || null;
              setPessoalIp(ipEsp);
              
              console.log("Login bem-sucedido!");
              return true;
            } else {
              console.log("A senha digitada não bate com a do banco.");
              return false;
            }
        } catch (err) {
            console.error("Erro fatal no confirmPass:", err);
            return false;
        }
    };

    const login = async () => {
        setAuthForm('login')
        const {usuarioL, senhaL} = loginCredentials
        const checkCred = await confirmPass(usuarioL, senhaL);
        if (checkCred) {
            setLogged(true);
            setloginErro(false);
            router.push('/home');
        } else {
            setloginErro(true);
        }
}

    const signin = async () => {
        setAuthForm('signin')
        const {usuarioS, emailS, senhaS} = signCredentials
        const checkAcc = await credentialsExist(emailS, usuarioS)
        if (checkAcc) {
            const checkError = analisarErros(usuarioS, senhaS, emailS)
            if (checkError) {
                const generatedId = Math.floor(100000 + Math.random() * 900000).toString();
                setId(generatedId)
            try {
                const emailData = {
                service_id: serviceId,
                template_id: templateId,
                user_id: publicKey,
                template_params: {
                email: emailS,
                ID: generatedId,
                name: usuarioS
                }
            }
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });
        if (response.ok) {
            Alert.alert('Sucesso', `E-mail enviado!`);
            router.replace('/(auth)/authid');
        } else {
            throw new Error('Falha na resposta da API');
        }
    } catch (err) {
        Alert.alert("Erro", "Não foi possível enviar o e-mail.")
    }}}}

    const alreadyInEquip = async(equipid) => {
        const already = myEquip.some(item => item.id === equipid)
        if (already) {
            Alert.alert('Você já está nessa equipe')
            return true
        } else return false
    }

    const fetchInitialData = async () => {
            const { data, error } = await supabase
                .from('historico')
                .select('*, usuarios(avatares)')
                .order('created_at', { ascending: false });
            
            if (!error) {
                const formatted = data.map(item => ({
                    id: item.id,
                    descricao: item.descricao,
                    por: item.user,
                    equipid: item.equipid,
                    tipo: item.from,
                    dia: new Date(item.created_at).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}),
                    hora: new Date(item.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit', second: '2-digit'})
                }));
                setHistorico(formatted);
            }
        };

    useEffect(() => {        
        fetchInitialData();

        const canalHistorico = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'historico' },
                () => fetchInitialData()
            )
            .subscribe()
        return () => {
            supabase.removeChannel(canalHistorico);        
        };
    }, []);

    const setPublicEquip = async() => {
        try{
            const {data, error} = await supabase
            .from('equipes')
            .select('*')
            .eq('servidor', true)

            if(error) throw(error)

            const creating = data.map(item => ({
                id: item.id,
                nome: item.equipe,
                entrada: item.entrada
            }))
        setAllEquips(creating)
        }
        catch(e) { console.log("Erro ao buscar equipes:", e.message) }
    }

  const createEquip = async (macAddress) => {
  if (myEquip && myEquip.length > 0) {
    Alert.alert('Aviso', 'Você já pertence a uma equipe. Saia dela antes de criar outra.');
    return;
  }

  try {
    const isPublic = valorSever === 1 ? true : false;
    
    const { data: equipData, error: equipError } = await supabase
      .from('equipes')
      .insert([{ 
          equipe: equipName, 
          userid: userId, 
          mac: macAddress, 
          convite: valorInviteDados, 
          servidor: isPublic 
      }])
      .select('id')
      .single();

    if (equipError) throw equipError;

    const { error: creatorErro } = await supabase
      .from('userequips')
      .insert({ userid: userId, equipid: equipData.id, cargo: 'administrador' });

    if (creatorErro) throw creatorErro;

    Alert.alert('Sucesso', 'Equipe criada!');
    setCreatingEquip(false);

    await myEquips();

  } catch (e) {
    Alert.alert('Erro', e.message);
  }
};

const myEquips = async () => {
  if (!usuarioL) return;

  try {
    const { data, error } = await supabase
      .from('userequips')
      .select(`
          cargo, 
          equipes (
              id, equipe, convite, servidor, mac, 
              entrada, edit, ativacao, historico, opentime, 
              IPs ( ip )
          )
      `)
      .eq('userid', userId)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const item = data[0];
      const equipeDados = item.equipes;

      setMyEquip([{
        id: equipeDados.id,
        equipe: equipeDados.equipe,
        cargo: item.cargo,
        mac: equipeDados.mac,
        ip: equipeDados.IPs?.ip || null,
        invite: equipeDados.convite
      }]);

      setEquipConfig({
        equipeid: equipeDados.id,
        invite: equipeDados.convite,
        server: equipeDados.servidor,
        enter: equipeDados.entrada,
        edit: equipeDados.edit,
        ativation: equipeDados.ativacao,
        historico: equipeDados.historico,
        opentime: equipeDados.opentime
      });

      setEquipAtualId(equipeDados.id);

    } else {
      setMyEquip([]);
      setEquipConfig(null);
      setEquipAtualId('');
    }

  } catch (error) {
    Alert.alert('Erro', 'Não foi possível carregar os dados da equipe');
  }
};
    const carregarSolicitacoes = async (equipid) => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('id, by, promotionParametro')
                .eq('equipid', equipid)
                .eq('content', 'entrada') 
                .order('created_at', { ascending: false });

            if (error) throw error;

            const requestList = data.map(item => ({
                notifid: item.id, 
                userid: item.promotionParametro,
                username: item.by,
            }));

            setSolicitacoesEquipe(requestList);
        } catch (e) {
            console.log("Erro ao carregar solicitações:", e.message);
        }
    }

    const acceptSolicitation = async(notifid, by, equipid, aceitar) => {
        try {
            if (aceitar) {
                const { error: insertError } = await supabase
                    .from('userequips')
                    .insert({
                        userid: by,
                        equipid: equipid,
                        cargo: 'visitante'
                    })
                
                if (insertError) throw insertError;
                
                setSolicitacoesEquipe(solicitacoesEquipe.filter(by))
            }

            await supabase.from('notifications').delete().eq('id', notifid)
            await carregarSolicitacoes(equipid);

        } catch (e) {
        }
    }

    const requestEntrance = async(nome, by, userid, equipid) => {
        try {
            const { error } = await supabase
            .from('notifications') 
            .insert({
                equipeParametro: nome,
                by: by, 
                content: 'entrada',
                userid: userid, 
                promotionParametro: userId, 
                equipid: equipid 
            })
            return true
        } catch(e) {
            Alert.alert("Erro", "Falha ao enviar notificação: " + e.message)
            return false
        }
    }

    const enteringEquip = async(nome, user, useridDono, equipId) => {
        try {
            if (myEquip && myEquip.length > 0) {
                Alert.alert("Aviso", "Você já está em uma equipe. É permitido apenas uma por usuário.");
                return;
                }

            const {data: configEquipe, error: erroFetch} = await supabase
            .from('equipes')
            .select('entrada')
            .eq('id', equipId)
            .single();

            if (erroFetch) throw erroFetch;

            if (configEquipe.entrada) {
                await requestEntrance(nome, user, useridDono, equipId);
                Alert.alert("Sucesso", "Solicitação enviada!");
            } else {
                const { error: erroInsert }= await supabase
                    .from('userequips')
                    .insert({
                        userid: userId, 
                        equipid: equipId,
                        cargo: 'visitante'
                    });

            if (erroInsert) throw erroInsert;
            
            createPassEsp(equipId);
            Alert.alert("Sucesso", "Você entrou na equipe!");
            await myEquips();
            }
        } catch(erro) {
            Alert.alert("Erro", "Não foi possível processar a entrada na equipe.");
        }
    };

    const equipPage = async (equipid) => {
        try {
            const { data, error } = await supabase
            .from('userequips')
            .select('cargo, equipes(equipe, convite, servidor, mac), usuarios(user, id, avatares)')
            .eq('equipid', equipid);

            if (error) throw error;
            if (!data || data.length === 0) return;

            const usersShow = data.map(item => {
                let fotoUrl = null;

                if (item.usuarios?.avatares) {
                    const { data: urlData } = supabase.storage
                    .from('avatar')
                    .getPublicUrl(item.usuarios.avatares);
                    
                    fotoUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
                }

                return {
                    user: item.usuarios.user,
                    cargo: item.cargo,
                    id: item.usuarios.id,
                    image: fotoUrl
                }
            })

            setUsers(usersShow);

            const dadosEquipe = data[0].equipes;
            setEquipeName(dadosEquipe.equipe);
            setNomeRascunho(dadosEquipe.equipe);
            setInviteRascunho(dadosEquipe.convite);
            setServerRascunho(dadosEquipe.servidor ? 1 : 2);
            
            await carregarSolicitacoes(equipid);

        } catch (error) {
            console.error("Erro na equipPage:", error.message);
        }
    }

    const throwEquip = (equipId) => {
        equipPage(equipId)
        setEquipAtualId(equipId)
        router.push({
            pathname: '/team/equip',
            params: { id: equipId }
        })
    }

    const setAlertas = async() => {
        try{ 
            const {error, data} = await supabase
            .from('notifications')
            .select('*')
            .eq('userid', userId)
            .order('created_at', {ascending: false})

            if (error) throw(error)
            
            if (!error) {
                const notifications = data.map(item => ({
                    id: item.id,
                    data: item.created_at,
                    equipid: item.equipid,
                    userid: item.userid, 
                    content: item.content,
                    promotionParametro: item.promotionParametro,
                    equipeParametro: item.equipeParametro,
                    by: item.by
                }))
                setNotif(notifications)
            }
        } catch(e) {Alert.alert(e.message)}
    }

    const sendAlerta = async(iduser, content, promotionParametro, equipeParametro) => {
        try {
            const {error} = await supabase
            .from('notifications')
            .insert({
                userid: iduser,
                content: content,
                equipeParametro: equipeParametro,
                promotionParametro: promotionParametro,
                by: usuarioL
            })
        } catch(e) {Alert.alert(e.message)}
    }

    const awaitedFriendRequests = async () => {
    try {
        const { data, error } = await supabase
            .from('contatos')
            .select('sender, receiver, status')
            .or(`sender.eq.${usuarioL},receiver.eq.${userId}`); 

        if (error) throw error;

        const enviados = data
            .filter(item => item.sender === usuarioL && item.status === false) 
            .map(item => ({
                receiver: item.receiver,
                status: item.status
            }));        

        const recebidos = data
            .filter(item => item.receiver === userId && item.status === false) 
            .map(item => item.sender);              

        const amigosConfirmados = data
            .filter(item => item.status === true)
            .map(item => item.sender === usuarioL ? item.receiver : item.sender)

        return { enviados, recebidos, amigosConfirmados }

    } catch (e) {
        Alert.alert('Erro', e.message)
        return { enviados: [], recebidos: [], amigosConfirmados: [] }
    }
}

const carregarPedidos = async () => {
    const { enviados, recebidos, amigosConfirmados } = await awaitedFriendRequests()
    
    setPedidosEnviados(enviados || [])
    setPedidosRecebidos(recebidos || [])
    setAmigosIds(amigosConfirmados || [])
}

    const setFriends = async (friendId) => {
        try { 
            const { error } = await supabase
                .from('contatos')
                .insert({ sender: usuarioL, receiver: friendId, status: false })    
            
            if (error) throw error;
        } catch (error) {
            Alert.alert(error.message)
        }
    }
    
    const cancelFriendship = async (alvoAmigo) => {
        try { 
            const { error } = await supabase
                .from('contatos')
                .delete()
                .match({ sender: alvoAmigo, receiver: userId });

                if (error) throw(error)
                
                carregarPedidos();
            
        } catch (error) {
            Alert.alert("Erro ao cancelar", error.message)
        }
    }

    const acceptFriend = async(amigo) => {
        try { const {error} = await supabase
            .from('contatos')
            .update({status: true})
            .match({sender: amigo, receiver: userId})

            if (error) throw(error)

            carregarPedidos()

        } catch (error) {
            Alert.alert(error.message)
        }
    }

   const friends = async () => {
    try {
        const { error, data } = await supabase
            .from('contatos')
            .select('status, receiver, sender, usuarios!receiver(id, user, avatares)')
            .or(`sender.eq.${usuarioL},receiver.eq.${userId}`)
            .eq('status', true);

        if (error) throw error;

        const listaFinal = await Promise.all(data.map(async (item) => {
            const isMeReceiver = item.receiver === userId;
            let nomeAmigo, idAmigo, avatarPath;

            if (isMeReceiver) {
                nomeAmigo = item.sender;
                idAmigo = null
                
                const { data: userData } = await supabase
                    .from('usuarios')
                    .select('avatares, id')
                    .eq('user', item.sender)
                    .single();
                avatarPath = userData?.avatares;
                idAmigo = userData.id
            } else {
                nomeAmigo = item.usuarios.user;
                idAmigo = item.usuarios.id;
                avatarPath = item.usuarios.avatares;
            }

            let url = null;
            if (avatarPath) {
                const { data: imgData } = supabase.storage
                    .from('avatar')
                    .getPublicUrl(avatarPath);
                url = `${imgData.publicUrl}?t=${new Date().getTime()}`;
            }

            return { id: idAmigo, nome: nomeAmigo, publicUrl: url };
        }));

        return listaFinal;
    } catch (error) {
        console.error("Erro ao carregar amigos:", error.message);
        return [];
    }
}

    const equipesUserSelected = async (userReference) => {
        setUserReferenceEquips(null)
        if (!userReference || userReference === null) return

        try {
            const { error, data } = await supabase
                .from('userequips')
                .select('equipid, equipes(equipe, id)')
                .eq('userid', userReference)

            if (error) throw error;

            if (data) {
                const filterEquip = data
                    .filter(item => item.equipes !== null) 
                    .map(item => ({
                        id: item.equipes.id,
                        equipe: item.equipes.equipe 
                    })) || []
                setUserReferenceEquips(filterEquip);
            }
        } catch (e) {
            Alert.alert("Erro ao buscar equipes", e.message)
            setUserReferenceEquips([])
        }
    }

    const sendInviteEquip = async ({ idAlvo, tipo, equipeNome = null, idEquipe = null, idReferencia = null }) => {
    try {
        
        const { error } = await supabase
            .from('notifications')
            .insert({
                userid: idAlvo,
                content: tipo,
                equipeParametro: equipeNome,
                equipid: idEquipe, 
                promotionParametro: idReferencia || userId,
                by: usuarioL 
            })

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Erro ao criar notificação:", e.message);
        return false;
    }
};

    const carregarSolicitacoesEntrada = async () => {
        try {
            if (!userId) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('id, by, promotionParametro, equipid, equipeParametro')
                .eq('userid', userId) 
                .eq('content', 'entrada') 
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatadas = data.map(item => ({
                notifid: item.id,
                username: item.by, 
                useridAlvo: item.promotionParametro, 
                equipid: item.equipid,
                nomeEquipe: item.equipeParametro
            }));

            setSolicitacoesEquipe(formatadas);
        } catch (e) {
            console.error("Erro ao carregar solicitações de entrada:", e.message);
        }
    }

            
    const gerenciarSolicitacaoEquipe = async (notifid, useridAlvo, equipid, aceitar) => {
        try {
            if (aceitar) {
            const { data: userCurrentEquips, error: checkError } = await supabase
                .from('userequips')
                .select('id')
                .eq('userid', useridAlvo)
                .limit(1);
                
            if (checkError) throw checkError;

            if (userCurrentEquips && userCurrentEquips.length > 0) {
                Alert.alert("Aviso", "Este usuário já entrou em outra equipe e não pode ser adicionado.");
                return; 
            }

            const { error: errorInsert } = await supabase
                .from('userequips')
                .insert({
                    userid: useridAlvo,
                    equipid: equipid,
                    cargo: 'membro' 
                });

            if (errorInsert) throw errorInsert;
            Alert.alert("Sucesso", "Novo membro adicionado à equipe!");
            }

            const { error: errorDelete } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notifid);

            if (errorDelete) throw errorDelete;

            setSolicitacoesEquipe(prev => prev.filter(item => item.notifid !== notifid));
            await myEquips(); 

        } catch (e) {
            Alert.alert("Erro ao processar", e.message);
        }
    }

    const sendMessage = async(equipid, userid, message) => {
        if (message.trim() == '') return
        try {
            const {data, error} = await supabase
                .from('chat')
                .insert({equipid: equipid, userid: userid, message: message})
            if (error) throw(error)
        } catch (error) {
            Alert.alert(error.message)
        }
    }

    const takeLdr = async() => {
        const ip = espIp.replace('http://', '').trim()
        if(ip == null || ip == '') return
        try {
            const { data, error } = await supabase
                .from('IPs')
                .select('ldr')
                .eq('ip', ip)
                .single();

            if (error) throw error;
            if (data) setLdr(data.ldr);
        } catch (error) {
            console.error("Erro ao buscar LDR inicial:", error.message);
        }
    };

    const excludePassEsp = async(userid, equipid) => {
        const {error} = await supabase
            .from('pass')
            .eq('userid', userid)
            .eq('equipid', equipid)
            .delete()
    }

    const setPassEsp = async(type, pass, equipid) => {
        if(type == 1 && pass) {
            const {error} = await supabase
                .from('userequips')
                .eq('userid', userReferenceEquips)
                .insert({passe: pass})
        }
    }

    const getPassExistent = async(pass, equipid) => {
        try {
            const {error, data} = await supabase
                .from('userequips')
                .select('passe')
                .eq('passe', pass)

            if(error) throw error
            if(data.length > 0) 
                createPassEsp(equipid)
            else {setPassEsp(1, pass, equipid)}
            
        } catch (error) {
            Alert.alert(error.message)
        }
    }
    const createPassEsp = (equipid) => {
        let pass = ''
        for(let i = 0; i < 8; i++) { pass += `${Math.floor(Math.random() * 9) + 1}`}
        getPassExistent(pass, equipid)
    }

    const confirmAtualUsage = async() => {
    if(!espIp) return
    try {
        const {data, error} = await supabase
            .from('IPs')
            .select('confirm, ativo, ip')
            .eq('ip', espIp)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Nenhum IP cadastrado');
            }
            throw error
        }

        if(data.confirm == true || data.ativo == true) setOpacityActive(true) 
        else setOpacityActive(false)
        
    } catch (error) {
        Alert.alert("Aviso", error.message) 
    }
}

    return (
        <appContext.Provider value={{ 
            throwEquip, historico, addHistory, logged, setLogged, 
            setId, id, saveCredentials,
            setConfirmCred, alreadyRegistred,
            firstLog, setFirstLog, espIp, setEspIp,
            redefinirPass, senhaA, setSenhaA, confirmCred,
            setUserCheck, setSmallPass, setEmailCheck,
            emailCheck, smallPass, valid, setValid,
            analisarErros, userCheck, errorClean,
            loginErro, logout,
            loginSave, setLoginSave, activeLoginSave, signCredentials, setSignCredentials
            , setLoginCredentials,
            loginCredentials, login, signin, credentialChange, enterEquip, myEquips,
            allEquips, myEquip, createEquip, equipName, setEquipName,equipPage, users,
            usuarioL, espIp, setShareIp, shareIp, equipAtualId, setEquipAtualId,
            pessoalIp, equipPage, setPessoalIp, equipId, userId, notif, sendAlerta, setAlertas,
            equipeName, setEquipeName, valorIp, setValorIp, valorSever, setValorServer, valorInviteDados, setValorInviteDados,
            inviteDados, equipServer, localIp, checkEquipNetwork, handleConfirmar, setInviteRascunho, inviteRascunho, serverRascunho,
            setServerRascunho, nomeRascunho, setNomeRascunho, ipRascunho, setIpRascunho, nameError, ipError, requestEntrance, userId, solicitacoesEquipe,
            acceptSolicitation, setExp, exp, cancelFriendship, setFriends, carregarPedidos, pedidosRecebidos, pedidosEnviados, friends, acceptFriend, 
            awaitedFriendRequests, userReferenceEquips, equipesUserSelected, amigosIds, sendInviteEquip,carregarSolicitacoesEntrada, 
            gerenciarSolicitacaoEquipe, solicitacoesEquipe, cargos, sendMessage, equipType, equipTypeRascunho, setEquipTypeRascunho, ldr,
            excludePassEsp, createPassEsp, opacityActive, setOpacityActive, setMyEquip, setEquipConfig,
            historicoRascunho, setHistoricoRascunho, ativacaoRascunho, setAtivacaoRascunho, tempoRascunho, setTempoRascunho, enteringEquip
        }}>
            {children}
        </appContext.Provider>
    )
}