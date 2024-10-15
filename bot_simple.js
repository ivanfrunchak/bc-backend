var config = {
    bet: { label: "bet", value: currency.minAmount, type: "number" },
    payout: { label: "payout", value: 2, type: "number" },
  };
  
  function main() {
    game.onBet = function() {
      game.bet(config.bet.value, config.payout.value).then(function(payout) {
        if (payout > 1) {
          log.success("We won, payout " + payout + "X!");
        } else {
          log.error("We lost, payout " + payout + "X!");
        }
      });
    };
  }