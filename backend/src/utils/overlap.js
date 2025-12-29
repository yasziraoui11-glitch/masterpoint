const { minutesSinceMidnight } = require('./time');
function intervalsOverlap(aS,aE,bS,bE){return aS<bE && bS<aE;}
function hhmmWindowOverlap(aStart,aEnd,bStart,bEnd){
  const aS=minutesSinceMidnight(aStart), aE=minutesSinceMidnight(aEnd);
  const bS=minutesSinceMidnight(bStart), bE=minutesSinceMidnight(bEnd);
  if([aS,aE,bS,bE].some(v=>v===null)) return false;
  return intervalsOverlap(aS,aE,bS,bE);
}
module.exports={hhmmWindowOverlap};
