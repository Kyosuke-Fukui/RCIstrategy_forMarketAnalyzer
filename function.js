//損益計算
var PL = function (xArr, yArr, p1, p2, risk_rng, reward, dma, TrStop) {
  var sigarr = getDataSet(yArr, p1, p2, dma)[3];
  var PL_tan = 0; //損益率
  var PL_fuku = 1; //損益率（幾何平均）
  var trade = 0; //トレード回数
  var Buy_Price = 0; //買値
  var Sell_Price = 0; //売値
  var posiflg = 0; //ポジション状態（0:ノーポジ、1:買い玉あり、-1:売り玉あり）
  var win = 0; //勝ちトレード数
  var lose = 0; //負けトレード数
  var profit = 0; //利幅
  var loss = 0; //損失幅
  var risk = risk_rng;
  var TrStop_flag = 0;
  var TrStop_Price = 0;
  var buy_trade = 0;
  var buy_win = 0;
  var sell_trade = 0;
  var sell_win = 0;

  //グラフに表示するために設定
  var buyArr = [[], []];
  var sellArr = [[], []];
  var slArr = [[], []];
  var tpArr = [[], []];

  for (let i = 0; i < yArr.length; i++) {
    //買いシグナル点灯時
    if (sigarr[i] === 1) {
      //売りポジションがあれば決済
      if (posiflg == -1) {
        PL_tan += (Sell_Price - yArr[i]) / Math.abs(Sell_Price); //売り玉の損益確定
        PL_fuku *= Sell_Price / yArr[i];
        trade += 1; //決済時にトレードカウント
        sell_trade += 1;
        if (Sell_Price - yArr[i] > 0) {
          win += 1;
          sell_win += 1;
          profit += Sell_Price - yArr[i];
        } else {
          lose += 1;
          loss += Math.abs(Sell_Price - yArr[i]);
        }
      }
      Buy_Price = yArr[i]; //新規買い建て
      buyArr[0].push(xArr[i]); //買い建てのタイミングを配列に記録
      buyArr[1].push(Buy_Price);
      posiflg = 1;
      TrStop_flag = 0; //TrailingStop発動後シグナルが発生したときのため
      risk = risk_rng;
      //売りシグナル点灯時
    } else if (sigarr[i] === -1) {
      //買いポジションがあれば決済
      if (posiflg == 1) {
        PL_tan += (yArr[i] - Buy_Price) / Math.abs(Buy_Price); //買い玉の損益確定
        PL_fuku *= yArr[i] / Buy_Price;
        trade += 1;
        buy_trade += 1;
        if (yArr[i] - Buy_Price > 0) {
          win += 1;
          buy_win += 1;
          profit += yArr[i] - Buy_Price;
        } else {
          lose += 1;
          loss += Math.abs(yArr[i] - Buy_Price);
        }
      }
      Sell_Price = yArr[i]; //新規売り建て
      sellArr[0].push(xArr[i]); //売り建てのタイミングを配列に記録
      sellArr[1].push(Sell_Price);
      posiflg = -1;
      TrStop_flag = 0; //TrailingStop発動後シグナルが発生したときのため
      risk = risk_rng;
    } else {
      //買い建て中のとき
      if (posiflg === 1) {
        //損切判定処理
        if (risk > 0) {
          if (yArr[i] < Buy_Price * (1 - risk)) {
            PL_tan += (yArr[i] - Buy_Price) / Math.abs(Buy_Price); //買い玉の損益確定
            PL_fuku *= yArr[i] / Buy_Price;
            trade += 1;
            buy_trade += 1;
            posiflg = 0;
            slArr[0].push(xArr[i]); //損切のタイミングを配列に記録
            slArr[1].push(yArr[i]);
            lose += 1;
            loss += Math.abs(yArr[i] - Buy_Price);
          }
        }
        //利確判定処理
        if (reward > 0) {
          if (yArr[i] > Buy_Price * (1 + reward)) {
            PL_tan += (yArr[i] - Buy_Price) / Math.abs(Buy_Price); //買い玉の損益確定
            PL_fuku *= yArr[i] / Buy_Price;
            trade += 1;
            buy_trade += 1;
            posiflg = 0;
            tpArr[0].push(xArr[i]); //利確のタイミングを配列に記録
            tpArr[1].push(yArr[i]);
            win += 1;
            buy_win += 1;
            profit += yArr[i] - Buy_Price;
          }
        }

        //TrailingStop処理
        if (TrStop_flag === 1) {
          if (yArr[i] <= TrStop_Price) {
            PL_tan += (yArr[i] - Buy_Price) / Math.abs(Buy_Price); //買い玉の損益確定
            PL_fuku *= yArr[i] / Buy_Price;
            trade += 1;
            buy_trade += 1;
            posiflg = 0;
            //基本は利確だが急落時に損切になる可能性もある（終値使用のため）
            if (yArr[i] - Buy_Price > 0) {
              tpArr[0].push(xArr[i]); //利確のタイミングを配列に記録
              tpArr[1].push(yArr[i]);
              win += 1;
              buy_win += 1;
              profit += yArr[i] - Buy_Price;
            } else {
              slArr[0].push(xArr[i]); //損切のタイミングを配列に記録
              slArr[1].push(yArr[i]);
              lose += 1;
              loss += Math.abs(yArr[i] - Buy_Price);
            }
            TrStop_flag = 0;
            risk = risk_rng;
          } else if (yArr[i] > yArr[i - 1]) {
            TrStop_Price = yArr[i] - Buy_Price * TrStop; //価格上昇時のみストップ水準を上げる
          }
        } else {
          //TrailingStop発動
          if (TrStop > 0 && yArr[i] >= Buy_Price * (1 + TrStop)) {
            TrStop_flag = 1;
            risk = 0;
            TrStop_Price = Buy_Price;
          }
        }
      }

      //売り建て中のとき
      if (posiflg === -1) {
        //損切判定処理
        if (risk > 0) {
          if (yArr[i] > Sell_Price * (1 + risk)) {
            PL_tan += (Sell_Price - yArr[i]) / Math.abs(Sell_Price); //売り玉の損益確定
            PL_fuku *= Sell_Price / yArr[i];
            trade += 1;
            sell_trade += 1;
            posiflg = 0;
            slArr[0].push(xArr[i]); //損切のタイミングを配列に記録
            slArr[1].push(yArr[i]);
            lose += 1;
            loss += Math.abs(Sell_Price - yArr[i]);
          }
        }
        //利確判定処理
        if (reward > 0) {
          if (yArr[i] < Sell_Price * (1 - reward)) {
            PL_tan += (Sell_Price - yArr[i]) / Math.abs(Sell_Price); //売り玉の損益確定
            PL_fuku *= Sell_Price / yArr[i];
            trade += 1;
            sell_trade += 1;
            posiflg = 0;
            tpArr[0].push(xArr[i]); //利確のタイミングを配列に記録
            tpArr[1].push(yArr[i]);
            win += 1;
            sell_win += 1;
            profit += Sell_Price - yArr[i];
          }
        }

        //TrailingStop処理
        if (TrStop_flag === 1) {
          if (yArr[i] >= TrStop_Price) {
            PL_tan += (Sell_Price - yArr[i]) / Math.abs(Sell_Price); //売り玉の損益確定
            PL_fuku *= Sell_Price / yArr[i];
            trade += 1;
            sell_trade += 1;
            posiflg = 0;
            //基本は利確だが急騰時に損切になる可能性もある（終値使用のため）
            if (Sell_Price - yArr[i] > 0) {
              tpArr[0].push(xArr[i]); //利確のタイミングを配列に記録
              tpArr[1].push(yArr[i]);
              win += 1;
              sell_win += 1;
              profit += Sell_Price - yArr[i];
            } else {
              slArr[0].push(xArr[i]); //損切のタイミングを配列に記録
              slArr[1].push(yArr[i]);
              lose += 1;
              loss += Math.abs(Sell_Price - yArr[i]);
            }
            TrStop_flag = 0;
            risk = risk_rng;
          } else if (yArr[i] < yArr[i - 1]) {
            TrStop_Price = yArr[i] + Sell_Price * TrStop; //価格下落時のみストップ水準を下げる
          }
        } else {
          //TrailingStop発動
          if (TrStop > 0 && yArr[i] <= Sell_Price * (1 - TrStop)) {
            TrStop_flag = 1;
            risk = 0;
            TrStop_Price = Sell_Price;
          }
        }
      }
    }
  }

  return [
    trade, //トレード回数
    PL_tan * 100, //総損益率（単利）
    (PL_tan / trade) * 100, //平均損益率（算術平均）
    (PL_fuku - 1) * 100, //総損益率（複利）
    (PL_fuku ** (1 / trade) - 1) * 100, //平均損益率（幾何平均）
    buyArr,
    sellArr,
    slArr,
    tpArr,
    (win / trade) * 100, //勝率
    profit / win / (loss / lose), //リスクリワード比（平均利幅と平均損失幅の比）
    (buy_win / buy_trade) * 100,
    (sell_win / sell_trade) * 100,
  ];
};

//検証結果出力
async function plot_PL(xArr, yArr) {
  var p1 = parseInt($("#p1").val());
  var p2 = parseInt($("#p2").val());
  var risk = $("#risk").val() / 100;
  var reward = $("#reward").val() / 100;
  var dma = parseInt($("#DMA").val());
  var TrStop = $("#TrStop").val() / 100;
  var TR = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[0];
  var PL_tan = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[1].toFixed(2);
  var AVR_tan = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[2].toFixed(2);
  var PL_fuku = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[3].toFixed(2);
  var winrate = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[9].toFixed(2);
  var RR = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[10].toFixed(2);
  var Buy_WR = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[11].toFixed(2);
  var Sell_WR = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[12].toFixed(
    2
  );

  $("#pl").html(`（バックテスト結果）<br><li>トレード回数：${TR}回</li>
  <li>勝率：${winrate}%　平均RR：${RR}<br> （Buy：${Buy_WR}%、Sell：${Sell_WR}%）
  </li>
  <li>総損益率
    <table>
      <tr>
        <td>単利</td>
        <td>再投資利回り</td>
      </tr>   
      <tr>
        <td>${PL_tan}%</td>
        <td>${PL_fuku}%</td>
      </tr>
    </table>
  </li>
  <li>1トレードの平均損益率：${AVR_tan}%
  </li>
  `);

  var buyArr = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[5];
  var sellArr = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[6];
  var slArr = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[7];
  var tpArr = PL(xArr, yArr, p1, p2, risk, reward, dma, TrStop)[8];

  //売買のタイミングをグラフに描画
  await Plotly.plot("chart", [
    {
      x: buyArr[0],
      y: buyArr[1],
      name: "buy",
      mode: "markers",
      type: "scatter",
      line: {
        color: "red",
      },
    },
    {
      x: sellArr[0],
      y: sellArr[1],
      name: "sell",
      mode: "markers",
      type: "scatter",
      line: {
        color: "blue",
      },
    },
    {
      x: slArr[0],
      y: slArr[1],
      name: "stop loss",
      mode: "markers",
      type: "scatter",
      line: {
        color: "orange",
      },
    },
    {
      x: tpArr[0],
      y: tpArr[1],
      name: "take profit",
      mode: "markers",
      type: "scatter",
      line: {
        color: "green",
      },
    },
  ]);
}

//静止グラフ作成
async function getGraph_S(xArr, yArr) {
  var p1 = parseInt($("#p1").val());
  var p2 = parseInt($("#p2").val());
  var dma = 0; //グラフにdmaの値は影響しない

  var dataArrs = getDataSet(yArr, p1, p2, dma);

  var d1 = dataArrs[0]; //原データ
  var d2 = dataArrs[1]; //短期RCI
  var d3 = dataArrs[2]; //長期RCI
  var n1 = dataname;
  var n2 = `RCI(${p1})`;
  var n3 = `RCI(${p2})`;

  //テーブル名、期間選択の値を入力
  $("#table_name").val(`${n1}`);
  $(".time1").val(`${xArr[0].slice(0, 10)}T${xArr[0].slice(11)}`);
  $(".time2").val(
    `${xArr[xArr.length - 1].slice(0, 10)}T${xArr[xArr.length - 1].slice(11)}`
  );

  var layout = {
    autosize: false,
    width: 1050,
    height: 400,
    margin: {
      l: 40,
      r: 10,
      b: 60,
      t: 60,
    },
    title: {
      text: `${n1}`,
      font: {
        size: 24,
      },
    },
    xaxis: {
      title: `start :${xArr[0]} －  end :${xArr[xArr.length - 1]}`,
    },
    grid: {
      rows: 2,
      columns: 1,
      // pattern: "independent",
      subplots: ["xy", "xy2"],
    },
  };
  await Plotly.plot(
    "chart",
    [
      { x: xArr, y: d1, name: n1, line: { width: 1, color: "black" } },
      {
        x: xArr,
        y: d2,
        name: n2,
        line: { width: 1, color: "blue" },
        xaxis: "x",
        yaxis: "y2",
      },
      {
        x: xArr,
        y: d3,
        name: n3,
        line: { width: 1, color: "red" },
        xaxis: "x",
        yaxis: "y2",
      },
    ],
    layout
  );
}
