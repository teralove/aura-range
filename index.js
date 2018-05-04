const Command = require('command');

module.exports = function AuraRangeNotify(dispatch) {
    const command = Command(dispatch);
    const EffectId = 91101300;
    const UpdateDelay = 1000;
    
    let enabled = false,
    auraRange = 30, // in-game meters
    playerLocation,
    partyMembers = [],
    outOfRangePlayers = [],
    updateTimer = null,
    gameId;
    
    command.add('aurarange', ()=> {
        enabled = !enabled;
        command.message('(aura-range) ' + (enabled ? 'enabled' : 'disabled'));
        if (enabled) {
             if (updateTimer) clearInterval(updateTimer);
             updateTimer = setInterval(update, UpdateDelay);
        } else {
             if (updateTimer) clearInterval(updateTimer);
             removeAllVisuals();
             outOfRangePlayers = [];
        }
    });
    
    dispatch.hook('S_LOGIN', 10, (event) => {
        gameId = event.gameId;
        let job = (event.templateId - 10101) % 100;
        enabled = (job === 7) ? true : false;
        if (!enabled) return;
        
        if (updateTimer) clearInterval(updateTimer);
        updateTimer = setInterval(update, UpdateDelay);
    })
    
    dispatch.hook('C_PLAYER_LOCATION', 3, (event) => {
        playerLocation = event;
    })
    
    dispatch.hook('S_PARTY_MEMBER_LIST', 6, (event) => {
        partyMembers = event.members;
        
        // remove self from targets
        for (let i = 0; i < partyMembers.length; i++) {
            if (partyMembers[i].gameId.equals(gameId)) {
                partyMembers.splice(i, 1);
                return;
            }
        }
    })
    
    dispatch.hook('S_SPAWN_USER', 13, (event) => {
        if (partyMembers.length != 0) {
            for (let i = 0; i < partyMembers.length; i++) {
                if (partyMembers[i].gameId.equals(event.gameId)) {
                    partyMembers[i].loc = event.loc;
                    return;
                }
            }
        }
    })
    
    dispatch.hook('S_USER_LOCATION', 3, (event) => {
        if (partyMembers.length != 0) {
            for (let i = 0; i < partyMembers.length; i++) {
                if (partyMembers[i].gameId.equals(event.gameId)) {
                    partyMembers[i].loc = event.loc;
                    return;
                }
            }
        }
    })
    
    dispatch.hook('S_USER_LOCATION_IN_ACTION', 2, (event) => {
        if (partyMembers.length != 0) {
            for (let i = 0; i < partyMembers.length; i++) {
                if (partyMembers[i].gameId.equals(event.gameId)) {
                    partyMembers[i].loc = event.loc;
                    return;
                }
            }
        }
    })
    
    dispatch.hook('S_LEAVE_PARTY', 1, (event) => {
        if (updateTimer) clearInterval(updateTimer);
        removeAllVisuals();
        partyMembers = [];
        outOfRangePlayers = [];
    })
    
    function update() {
        if (playerLocation == undefined) return;
        for (let i = 0; i < partyMembers.length; i++) {
            if (partyMembers[i].loc != undefined) {
                if (partyMembers[i].loc.dist3D(playerLocation.loc) / 25 > auraRange) {
                    // out of range, apply effect
                    if (!outOfRangePlayers.includes(partyMembers[i].playerId)) {
                        outOfRangePlayers.push(partyMembers[i].playerId);
                        applyVisual(partyMembers[i]);
                    }
                } else {
                    // in range, remove effect
                    for (let j = 0; j < outOfRangePlayers.length; j++) {
                        if (outOfRangePlayers[j] === partyMembers[i].playerId) {
                            removeVisual(partyMembers[i]);
                            outOfRangePlayers.splice(j, 1);
                            break;
                        }
                    }
                }
                
            }
        }
        if (!enabled) {
            if (updateTimer) clearInterval(updateTimer);
            return;
        }
    }
    
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
