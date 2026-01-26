import React, { useState } from "react";

/* 공통 버튼 */
const OptionButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: "12px 8px",
      borderRadius: 12,
      border: active ? "2px solid #000" : "1px solid #ddd",
      background: active ? "#000" : "#fff",
      color: active ? "#fff" : "#111",
      cursor: "pointer"
    }}
  >
    {children}
  </button>
);

/* 위험 수치 색상 */
const levelColor = (value, limit) => {
  if (value > limit) return "red";
  if (value > limit * 0.7) return "orange";
  return "green";
};

/* 신뢰도 상태 */
const confidenceStatus = (c) => {
  if (c < 60) return { label: "❌ 불확실", color: "red" };
  if (c < 80) return { label: "⚠️ 주의", color: "orange" };
  return { label: "✅ 신뢰 가능", color: "green" };
};

/* 이미지 전처리 */
const preprocessImage = async (file) => {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise((res) => (img.onload = res));

  const canvas = document.createElement("canvas");
  const maxSize = 640;
  let { width, height } = img;

  if (width > height && width > maxSize) {
    height *= maxSize / width;
    width = maxSize;
  } else if (height > maxSize) {
    width *= maxSize / height;
    height = maxSize;
  }

  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(img, 0, 0, width, height);

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
  );
};

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [gender, setGender] = useState("unknown");
  const [ageGroup, setAgeGroup] = useState("adult");
  const [mealTime, setMealTime] = useState("아침");
  const [goal, setGoal] = useState("유지");

  // ✅ 피드백 관련 state
  const [feedback, setFeedback] = useState(null); // "yes" | "no"
  const [feedbackReason, setFeedbackReason] = useState(null);

  const analyze = async () => {
    if (!file || loading) return;

    setLoading(true);
    setResult(null);
    setFeedback(null);
    setFeedbackReason(null);

    try {
      const fd = new FormData();
      const processed = await preprocessImage(file);

      fd.append("image", processed, "food.jpg");
      fd.append("gender", gender);
      fd.append("age_group", ageGroup);
      fd.append("meal_time", mealTime);
      fd.append("goal", goal);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const res = await fetch(
        "https://luck-cal-backend-3.onrender.com/analyze",
        {
          method: "POST",
          body: fd,
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("AI 분석 실패");

      const data = await res.json();

      setResult({
        food: data.food || "음식 인식 불확실",
        confidence: typeof data.confidence === "number" ? data.confidence : 0,
        nutrition: data.nutrition || null,
        advice: data.advice || "AI 조언을 생성하지 못했습니다."
      });
    } catch (err) {
      setResult({
        food: "분석 실패",
        confidence: 0,
        nutrition: null,
        advice:
          err.name === "AbortError"
            ? "🤖 AI 응답이 지연되었습니다. 다시 시도해주세요."
            : "이미지를 다시 촬영하거나 다른 음식으로 시도해 주세요."
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setFeedback(null);
    setFeedbackReason(null);
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>🍀 Luck Cal AI</h2>
<p style={{ textAlign: "center", fontSize: 12, color: "#777", marginTop: 4 }}>
  현재 베타 서비스 중입니다. AI 분석 결과는 참고용으로 활용해주세요.
</p>

      <b>성별</b>
      <div style={{ display: "flex", gap: 8 }}>
        <OptionButton active={gender === "male"} onClick={() => setGender("male")}>남성</OptionButton>
        <OptionButton active={gender === "female"} onClick={() => setGender("female")}>여성</OptionButton>
        <OptionButton active={gender === "unknown"} onClick={() => setGender("unknown")}>공개안함</OptionButton>
      </div>

      <b style={{ display: "block", marginTop: 16 }}>연령대</b>
      <div style={{ display: "flex", gap: 8 }}>
        {["infant", "child", "teen", "adult"].map(v => (
          <OptionButton key={v} active={ageGroup === v} onClick={() => setAgeGroup(v)}>
            {v === "infant" ? "유아" : v === "child" ? "아동" : v === "teen" ? "청소년" : "성인"}
          </OptionButton>
        ))}
      </div>

      <b style={{ display: "block", marginTop: 16 }}>식사 시간대</b>
      <div style={{ display: "flex", gap: 8 }}>
        {["아침", "점심", "저녁", "야식"].map(t => (
          <OptionButton key={t} active={mealTime === t} onClick={() => setMealTime(t)}>
            {t}
          </OptionButton>
        ))}
      </div>

      <b style={{ display: "block", marginTop: 16 }}>목표</b>
      <div style={{ display: "flex", gap: 8 }}>
        {["다이어트", "유지", "벌크업"].map(g => (
          <OptionButton key={g} active={goal === g} onClick={() => setGoal(g)}>
            {g}
          </OptionButton>
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        style={{ marginTop: 16 }}
        onChange={(e) => {
          const f = e.target.files[0];
          if (!f) return;
          setFile(f);
          setPreview(URL.createObjectURL(f));
        }}
      />

      {preview && (
        <img src={preview} alt="preview" style={{ width: "100%", marginTop: 12, borderRadius: 12 }} />
      )}

      <button
        onClick={analyze}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: 16,
          padding: 14,
          borderRadius: 14,
          background: "#000",
          color: "#fff",
          border: "none",
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? "🔄 분석 중..." : "분석하기"}
      </button>

      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>{result.food}</h3>

          <div style={{ color: confidenceStatus(result.confidence).color }}>
            AI 신뢰도: {result.confidence}% ({confidenceStatus(result.confidence).label})
          </div>

          {result.nutrition && result.confidence >= 60 && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div>🔥 {result.nutrition.calories} kcal</div>
              <div>💪 {result.nutrition.protein} g</div>
              <div style={{ color: levelColor(result.nutrition.sodium, 1000) }}>
                ⚠️ {result.nutrition.sodium} mg
              </div>
            </div>
          )}

          <p style={{ marginTop: 12 }}>🤖 {result.advice}</p>

          <p style={{ fontSize: 12, color: "#777" }}>
            ※ AI 예측 결과이며 실제 음식과 다를 수 있습니다.
          </p>

          {/* 👍👎 피드백 */}
          <div style={{ marginTop: 16 }}>
            {!feedback ? (
              <>
                <p>도움이 되셨나요?</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setFeedback("yes")}>👍 네</button>
                  <button onClick={() => setFeedback("no")}>👎 아니요</button>
                </div>
              </>
            ) : feedback === "no" && !feedbackReason ? (
              <>
                <p style={{ marginTop: 8 }}>어떤 점이 아쉬웠나요?</p>
                {["음식 인식이 틀림", "영양 수치가 이상함", "조언이 별로임", "기타"].map(r => (
                  <button
                    key={r}
                    onClick={() => setFeedbackReason(r)}
                    style={{ display: "block", marginTop: 6 }}
                  >
                    {r}
                  </button>
                ))}
              </>
            ) : (
              <p style={{ marginTop: 8, color: "#555" }}>
                🙏 피드백 감사합니다!
              </p>
            )}
          </div>

          <button onClick={reset} style={{ marginTop: 12 }}>
            🔁 다시 분석
          </button>
        </div>
      )}
    </div>
  );
}
