const Command = require('command');

module.exports = function AuraRangeNotify(dispatch) {
    const command = Command(dispatch);
    const auras = [700230,700231,700232,700233,700330,700630,700631,700730,700731,601,602,603];
    const EffectId = 90520;
    
    let enabled = false,
    partyMembers = [],
    auraMembers = [],
    gameId;
    
    command.add(['aurarange','aura-range', 'aura', 'auras', 'ar'], ()=> {
        enabled = !enabled;
        command.message('(aura-range) ' + (enabled ? 'enabled' : 'disabled'));
        if (!enabled) removeAllVisuals()
        if (enabled) {
            for (let member of auraMembers) {
                applyVisual({gameId: JSON.parse(member)})
            }
        }
    });
    
    dispatch.hook('S_LOGIN', 10, (event) => {
        gameId = event.gameId;
        let job = (event.templateId - 10101) % 100;
        enabled = (job === 7) ? true : false;
        partyMembers = [{gameId: gameId}];
        auraMembers = [];
    })
    
    dispatch.hook('S_PARTY_MEMBER_LIST', 6, (event) => {
        partyMembers = event.members;
    })
    
    dispatch.hook('S_LEAVE_PARTY', 1, (event) => {
        removeAllVisuals();
        partyMembers = [{gameId: gameId}];
        let stringId = JSON.stringify(gameId)
        if (auraMembers.includes(stringId)){
            auraMembers=[stringId]
        }
        else {
            auraMembers=[]
        }
    })

    dispatch.hook('S_ABNORMALITY_BEGIN', 2, (event) => {
        if (enabled && event.id == EffectId) return false
        for (let member of partyMembers) {
            if (member.gameId.equals(event.target)) {
                if (auras.includes(event.id)) {
                    let stringId = JSON.stringify(member.gameId)
                    if (!auraMembers.includes(stringId)) {
                        auraMembers.push(stringId)
                        if (enabled) applyVisual(member)
                    }
                }
                return
            }
        }
    })

    dispatch.hook('S_ABNORMALITY_REFRESH', 1, (event) => {
        if (enabled && event.id == EffectId) return false
        for (let member of partyMembers) {
            if (member.gameId.equals(event.target)) {
                if (auras.includes(event.id)) {
                    let stringId = JSON.stringify(member.gameId)
                    if (!auraMembers.includes(stringId)) {
                        auraMembers.push(stringId)
                        if (enabled) applyVisual(member)
                    }
                }
                return
            }
        }
    })

    dispatch.hook('S_ABNORMALITY_END', 1, (event) => {
        if (enabled && event.id == EffectId) return false
        for (let member of partyMembers) {
            if (member.gameId.equals(event.target)) {
                if (auras.includes(event.id)) {
                    let stringId = JSON.stringify(member.gameId)
                    if (auraMembers.includes(stringId)) {
                        auraMembers.splice(auraMembers.indexOf(stringId), 1)
                        if (enabled) removeVisual(member)
                    }
                }
                return
            }
        }
    })
    
    function applyVisual(member) {
        dispatch.toClient('S_ABNORMALITY_END', 1, {
            target: member.gameId,
            id: EffectId
        });
        dispatch.toClient('S_ABNORMALITY_BEGIN', 2, {
            target: member.gameId,
            source: gameId,
            id: EffectId,
            duration: 864000000,
            unk: 0,
            stacks: 1,
            unk2: 0
        });
    }
    
    function removeVisual(member) {
        dispatch.toClient('S_ABNORMALITY_END', 1, {
            target: member.gameId,
            id: EffectId
        });	
    }
    
    function removeAllVisuals() {
        for(let i = 0; i < partyMembers.length; i++) {
            removeVisual(partyMembers[i]);
        }
    }
    
}
