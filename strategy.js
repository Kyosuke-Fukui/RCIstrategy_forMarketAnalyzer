let RCI = (values, period) => {
  let result = [];
  for (let i = 0; i < period - 1; i++) {
    result.push(NaN);
  }
  for (let end = period - 1; end < values.length; end++) {
    let start = end - period + 1;
    let target = values.slice(start, end + 1);
    let target_sorted = values.slice(start, end + 1).sort((a, b) => {
      return b - a;
    });
    let i = 0;
    let d = 0;
    while (i < period) {
      let time_rank = period - i;
      let price_rank = target_sorted.indexOf(target[i]) + 1;
      d = d + (time_rank - price_rank) * (time_rank - price_rank);
      i += 1;
    }
    let rci = (6 * d) / (period * (period * period - 1));
    rci = (1 - rci) * 100;
    result.push(rci);
  }
  return result;
};

//ゴールデンクロス・デッドクロスのシグナル配列を返す関数
var GCDC = function (a, b, dma) {
  var a_b = [];
  for (let i = 0; i < a.length; i++) {
    a_b.push(a[i] - b[i]);
  }
  var gcdc = [0];
  for (let j = 1; j < a.length; j++) {
    if (a_b[j - 1] < 0 && a_b[j] >= 0) {
      gcdc.push(1);
    } else if (a_b[j - 1] > 0 && a_b[j] <= 0) {
      gcdc.push(-1);
    } else {
      gcdc.push(0);
    }
  }

  //シグナル発生をDMAパラメータ分だけ遅らせる
  if (dma > 0) {
    for (let k = 1; k < dma + 1; k++) {
      gcdc.unshift(0);
      gcdc.pop();
    }
  }
  return gcdc;
};

//分析対象のデータ群を設定する関数
var getDataSet = function (mArray, p1, p2, dma) {
  var rawdata = mArray;
  var ind1 = RCI(rawdata, p1); //ここを変えれば様々なインジケータを利用可能
  var ind2 = RCI(rawdata, p2);
  var sigarr = GCDC(ind1, ind2, dma); //ここを変えれば様々な投資戦略を利用可能
  return [rawdata, ind1, ind2, sigarr];
};
