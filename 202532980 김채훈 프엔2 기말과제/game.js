let data = [];
let index = 0;
let user = null;
let isGameOver = false;

$(document).ready(function () {

  $("#startBtn").on("click", () => {
    const name = $("#nameInput").val().trim();
    if (!name) {
      alert("이름을 입력해주세요");
      return;
    }

    user = JSON.parse(localStorage.getItem(name)) || {
      name: name,
      totalScore: 0,
      games: []
    };

    localStorage.setItem(name, JSON.stringify(user));

    $("#userName").text(user.name + " 님");
    $("#startScreen").hide();

    initGame();
  });

});

function initGame() {
  fetch("word.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      $("#totalCount").text(data.length);
      index = 0;
      isGameOver = false;
      $("#checkBtn").prop("disabled", false);
      $("#nextBtn").prop("disabled", false);
      loadQuestion();
      updateStats();
      renderHistory();
    });

  $("#checkBtn").off().on("click", checkAnswer);
  $("#nextBtn").off().on("click", nextQuestion);
}

function loadQuestion() {
  if (isGameOver) return;

  $("#answerSlots").empty();
  $("#sourceBox").empty();
  $("#msg").text("");

  const q = data[index];
  $("#korText").text(q.kor);
  $("#currentCount").text(index + 1);

  const words = q.eng.split(" ");
  const shuffled = [...words].sort(() => Math.random() - 0.5);

  words.forEach(() => {
    const slot = $("<div class='slot'></div>");

    slot.on("dragover", e => e.preventDefault());

    slot.on("drop", e => {
      e.preventDefault();
      const id = e.originalEvent.dataTransfer.getData("cardId");
      const card = $("#" + id);
      if (slot.children().length === 0) slot.append(card);
    });

    $("#answerSlots").append(slot);
  });

  shuffled.forEach((word, i) => {
    const card = $("<div class='word-card' draggable='true'></div>");
    card.text(word);
    card.attr("id", `card-${index}-${i}`);

    card.on("dragstart", e => {
      e.originalEvent.dataTransfer.setData("cardId", card.attr("id"));
      card.addClass("dragging");
    });

    card.on("dragend", () => {
      card.removeClass("dragging");
    });

    $("#sourceBox").append(card);
  });

  $("#sourceBox")
    .off()
    .on("dragover", e => e.preventDefault())
    .on("drop", e => {
      e.preventDefault();
      const id = e.originalEvent.dataTransfer.getData("cardId");
      $("#sourceBox").append($("#" + id));
    });
}

function checkAnswer() {
  if (isGameOver) return;

  let result = [];

  $(".slot").each(function () {
    if ($(this).children().length === 0) {
      $("#msg").text("모든 칸을 채워주세요");
      return false;
    }
    result.push($(this).text());
  });

  if (result.length === 0) return;

  const correct = data[index].eng;
  const isCorrect = result.join(" ") === correct;
  const score = isCorrect ? result.length * 5 : 0;

  user.totalScore += score;

  user.games.push({
    kor: data[index].kor,
    eng: correct,
    user: result.join(" "),
    score: score,
    result: isCorrect
  });

  localStorage.setItem(user.name, JSON.stringify(user));

  if (index === data.length - 1) {
    isGameOver = true;
    $("#msg").text("🎉 모든 문제가 끝났습니다");
    $("#checkBtn").prop("disabled", true);
    $("#nextBtn").prop("disabled", true);
  } else {
    $("#msg").text(isCorrect ? `정답입니다! +${score}점` : "틀렸습니다");
  }

  updateStats();
  renderHistory();
}

function nextQuestion() {
  if (isGameOver) return;

  index++;
  if (index >= data.length) {
    isGameOver = true;
    $("#msg").text("🎉 모든 문제가 끝났습니다");
    $("#checkBtn").prop("disabled", true);
    $("#nextBtn").prop("disabled", true);
    return;
  }

  loadQuestion();
}

function updateStats() {
  $("#totalScore").text(user.totalScore);
}

function renderHistory() {
  $("#historyList").empty();
  user.games.forEach(g => {
    $("#historyList").append(
      `<li>${g.kor} / ${g.score}점 (${g.result ? "O" : "X"})</li>`
    );
  });
}
