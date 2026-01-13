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
      cursor: "pointer",
      transition: "all 0.2s"
    }}
  >
    {children}
  </button>
);

/* 수치 색상 판단 */
const levelColor = (value, limit) => {
  if (value > limit) return "red";
  if (value > limit * 0.7) return "orange";
  return "green";
};

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [gender, setGender] = useState("unknown");
  const [ageGroup, setAgeGroup] = useState("adult");
  const [goal, setGoal] = useState("maintain");
  const [mealTime, setMealTime] = useState("lunch");

  const analyze = async () => {
    if (!file) return alert("이미지를 선택하세요");

    setLoading(true);
    setResult(null);

    const fd = new FormData();
    fd.append("image", file);
    fd.append("gender", gender);
    fd.append("age_group", ageGroup);
    fd.append("goal", goal);
    fd.append("meal_time", mealTime);

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: fd
      });

      if (!res.ok) throw new Error("server error");
      const data = await res.json();
      setResult(data);
    } catch {
      /* 테스트용 더미 데이터 */
      setResult({
        food: "양념치킨 + 콜라",
        confidence: 88,
        nutrition: {
          calories: 1100,
          protein: 40,
          carbs: 100,
          fat: 50,
          fiber: 5,
          sugar: 30,
          sodium: 1200
        },
        advice:
          "현재 식사는 나트륨과 지방이 높은 편입니다. " +
          "야식이나 다이어트 목적이라면 콜라를 제로 음료로 바꾸고 " +
          "채소를 곁들이는 것이 좋습니다."
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "0 auto",
        padding: 20,
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        📸 음식 AI 분석
      </h2>

      {/* 성별 */}
      <div style={{ marginBottom: 20 }}>
        <b>성별</b>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <OptionButton active={gender === "male"} onClick={() => setGender("male")}>남성</OptionButton>
          <OptionButton active={gender === "female"} onClick={() => setGender("female")}>여성</OptionButton>
          <OptionButton active={gender === "unknown"} onClick={() => setGender("unknown")}>공개 안 함</OptionButton>
        </div>
      </div>

      {/* 연령대 */}
      <div style={{ marginBottom: 20 }}>
        <b>연령대</b>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {["infant", "child", "teen", "adult"].map(v => (
            <OptionButton key={v} active={ageGroup === v} onClick={() => setAgeGroup(v)}>
              {v === "infant" && "유아"}
              {v === "child" && "아동"}
              {v === "teen" && "청소년"}
              {v === "adult" && "성인"}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* 목표 */}
      <div style={{ marginBottom: 20 }}>
        <b>목표</b>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <OptionButton active={goal === "diet"} onClick={() => setGoal("diet")}>다이어트</OptionButton>
          <OptionButton active={goal === "maintain"} onClick={() => setGoal("maintain")}>유지</OptionButton>
          <OptionButton active={goal === "bulk"} onClick={() => setGoal("bulk")}>벌크업</OptionButton>
        </div>
      </div>

      {/* 식사 시간 */}
      <div style={{ marginBottom: 20 }}>
        <b>식사 시간</b>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <OptionButton active={mealTime === "breakfast"} onClick={() => setMealTime("breakfast")}>아침</OptionButton>
          <OptionButton active={mealTime === "lunch"} onClick={() => setMealTime("lunch")}>점심</OptionButton>
          <OptionButton active={mealTime === "dinner"} onClick={() => setMealTime("dinner")}>저녁</OptionButton>
          <OptionButton active={mealTime === "late"} onClick={() => setMealTime("late")}>야식</OptionButton>
        </div>
      </div>

      {/* 이미지 업로드 */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files[0];
          setFile(f);
          setPreview(URL.createObjectURL(f));
        }}
      />

      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{ width: "100%", marginTop: 12, borderRadius: 12 }}
        />
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
          fontSize: 16
        }}
      >
        {loading ? "🔄 분석중..." : "분석하기"}
      </button>

      {/* 결과 */}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>{result.food}</h3>
          <div>AI 신뢰도: {result.confidence}%</div>

          {/* 요약 카드 */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
              🔥<br />{result.nutrition.calories} kcal
            </div>
            <div style={{ flex: 1, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
              💪<br />{result.nutrition.protein} g
            </div>
            <div style={{ flex: 1, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
              ⚠️<br />
              <span style={{ color: levelColor(result.nutrition.sodium, 1000) }}>
                {result.nutrition.sodium} mg
              </span>
            </div>
          </div>

          {/* 상세 */}
          <p style={{ marginTop: 16, lineHeight: 1.6 }}>
            🤖 AI 조언<br />
            {result.advice}
          </p>

          <button
            onClick={reset}
            style={{
              marginTop: 16,
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "#fff"
            }}
          >
            🔁 다른 음식 분석하기
          </button>
        </div>
      )}
    </div>
  );
}
