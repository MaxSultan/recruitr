const performEloCalculation = ({winnerElo, loserElo, result}) => {
    const k = 16;
    const winTypeMultiplier = {
        'decision': 1,
        'major-decision':1.2,
        'technical-fall':1.4,
        'fall':1.6,
    }
    const winTypeAdjustedK = (winTypeMultiplier[result] || 1) * k;
    const expectedWinnerProbability = 1 / (1 + 10 ** ((loserElo - winnerElo) / 400));
    const expectedLoserProbability = 1 / (1 + 10 ** ((winnerElo - loserElo) / 400));
    const newWinnerElo = winnerElo + winTypeAdjustedK * (1 - expectedWinnerProbability);
    const newLoserElo = loserElo + winTypeAdjustedK * (0 - expectedLoserProbability);
    return {winnerElo: newWinnerElo, loserElo: newLoserElo};
}

module.exports = { performEloCalculation };