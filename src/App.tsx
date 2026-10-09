import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Rarity = "일반" | "서사" | "전설" | "신화";

type Unit = {
  id: number;
  name: string;
  rarity: Rarity;
  attack: number;
};

type Recipe = {
  materials: string[];
  result: string;
  resultAttack: number;
  resultRarity: Rarity;
};

type Enemy = {
  id: number;
  progress: number;
  hp: number;
  maxHp: number;
  defense: number;
  isBoss: boolean;
};

type Phase = "ready" | "battle" | "gameover" | "clear";

const ROUND_TIME = 40;
const SHORT_ROUND_TIME = 30;
const MAX_ROUND = 20;
const MAX_FIELD = 5;
const MAX_ENEMIES = 50;
const DRAGON_HP = 15000;
const NORMAL_ENEMIES_PER_ROUND = 20;
const BOSS_ROUND_INTERVAL = 10;

const ROUND_SETTINGS = [
  null,
  { hp: 100, defense: 5 },
  { hp: 115, defense: 6 },
  { hp: 130, defense: 7 },
  { hp: 145, defense: 8 },
  { hp: 160, defense: 9 },
  { hp: 175, defense: 10 },
  { hp: 190, defense: 11 },
  { hp: 205, defense: 12 },
  { hp: 220, defense: 13 },
  { hp: 5000, defense: 50 },
  { hp: 235, defense: 14 },
  { hp: 250, defense: 15 },
  { hp: 265, defense: 16 },
  { hp: 280, defense: 17 },
  { hp: 295, defense: 18 },
  { hp: 310, defense: 19 },
  { hp: 325, defense: 20 },
  { hp: 340, defense: 21 },
  { hp: 355, defense: 22 },
  { hp: 10000, defense: 75 },
] as const;

const isBossRound = (round: number) => round % BOSS_ROUND_INTERVAL === 0;

const GENERAL_UNITS: Omit<Unit, "id">[] = [
  { name: "가렌", rarity: "일반", attack: 32 },
  { name: "자르반 4세", rarity: "일반", attack: 28 },
  { name: "오리아나", rarity: "일반", attack: 38 },
  { name: "애쉬", rarity: "일반", attack: 45 },
  { name: "룰루", rarity: "일반", attack: 20 },
  { name: "럼블", rarity: "일반", attack: 40 },
  { name: "아무무", rarity: "일반", attack: 34 },
  { name: "신드라", rarity: "일반", attack: 42 },
  { name: "미스 포츈", rarity: "일반", attack: 50 },
  { name: "레오나", rarity: "일반", attack: 18 },
];

const RECIPES: Recipe[] = [
  // 일반 2개 → 서사: 동일 유닛 조합 10개
  { materials: ["가렌", "가렌"], result: "피오라", resultAttack: 70, resultRarity: "서사" },
  { materials: ["자르반 4세", "자르반 4세"], result: "신 짜오", resultAttack: 65, resultRarity: "서사" },
  { materials: ["오리아나", "오리아나"], result: "아지르", resultAttack: 75, resultRarity: "서사" },
  { materials: ["애쉬", "애쉬"], result: "케이틀린", resultAttack: 82, resultRarity: "서사" },
  { materials: ["룰루", "룰루"], result: "밀리오", resultAttack: 55, resultRarity: "서사" },
  { materials: ["럼블", "럼블"], result: "말파이트", resultAttack: 80, resultRarity: "서사" },
  { materials: ["아무무", "아무무"], result: "세주아니", resultAttack: 78, resultRarity: "서사" },
  { materials: ["신드라", "신드라"], result: "카시오페아", resultAttack: 84, resultRarity: "서사" },
  { materials: ["미스 포츈", "미스 포츈"], result: "루시안", resultAttack: 90, resultRarity: "서사" },
  { materials: ["레오나", "레오나"], result: "알리스타", resultAttack: 60, resultRarity: "서사" },
  // 일반 교차 조합 5개
  { materials: ["가렌", "럼블"], result: "크산테", resultAttack: 88, resultRarity: "서사" },
  { materials: ["자르반 4세", "아무무"], result: "이블린", resultAttack: 82, resultRarity: "서사" },
  { materials: ["오리아나", "신드라"], result: "르블랑", resultAttack: 86, resultRarity: "서사" },
  { materials: ["애쉬", "미스 포츈"], result: "이즈리얼", resultAttack: 95, resultRarity: "서사" },
  { materials: ["룰루", "레오나"], result: "블리츠크랭크", resultAttack: 72, resultRarity: "서사" },

  // 서사 2개 → 전설
  { materials: ["피오라", "피오라"], result: "이렐리아", resultAttack: 200, resultRarity: "전설" },
  { materials: ["신 짜오", "신 짜오"], result: "리 신", resultAttack: 190, resultRarity: "전설" },
  { materials: ["아지르", "아지르"], result: "빅토르", resultAttack: 205, resultRarity: "전설" },
  { materials: ["케이틀린", "케이틀린"], result: "아펠리오스", resultAttack: 230, resultRarity: "전설" },
  { materials: ["밀리오", "밀리오"], result: "레나타", resultAttack: 175, resultRarity: "전설" },
  { materials: ["말파이트", "말파이트"], result: "오른", resultAttack: 220, resultRarity: "전설" },
  { materials: ["세주아니", "세주아니"], result: "마오카이", resultAttack: 215, resultRarity: "전설" },
  { materials: ["카시오페아", "카시오페아"], result: "흐웨이", resultAttack: 230, resultRarity: "전설" },
  { materials: ["루시안", "루시안"], result: "자야", resultAttack: 240, resultRarity: "전설" },
  { materials: ["알리스타", "알리스타"], result: "라칸", resultAttack: 200, resultRarity: "전설" },
  { materials: ["크산테", "크산테"], result: "사이온", resultAttack: 250, resultRarity: "전설" },
  { materials: ["이블린", "이블린"], result: "트런들", resultAttack: 225, resultRarity: "전설" },
  { materials: ["르블랑", "르블랑"], result: "아칼리", resultAttack: 230, resultRarity: "전설" },
  { materials: ["이즈리얼", "이즈리얼"], result: "코그모", resultAttack: 255, resultRarity: "전설" },
  { materials: ["블리츠크랭크", "블리츠크랭크"], result: "쓰레쉬", resultAttack: 240, resultRarity: "전설" },

  // 전설 2개 → 신화: 각 전설은 서로 다른 신화 2개에 사용
  { materials: ["이렐리아", "리 신"], result: "나피리", resultAttack: 500, resultRarity: "신화" },
  { materials: ["리 신", "오른"], result: "오공", resultAttack: 510, resultRarity: "신화" },
  { materials: ["레나타", "마오카이"], result: "릴리아", resultAttack: 520, resultRarity: "신화" },
  { materials: ["마오카이", "라칸"], result: "브랜드", resultAttack: 530, resultRarity: "신화" },
  { materials: ["흐웨이", "자야"], result: "직스", resultAttack: 500, resultRarity: "신화" },
  { materials: ["빅토르", "아펠리오스"], result: "멜", resultAttack: 510, resultRarity: "신화" },
  { materials: ["오른", "흐웨이"], result: "라이즈", resultAttack: 520, resultRarity: "신화" },
  { materials: ["자야", "라칸"], result: "시비르", resultAttack: 530, resultRarity: "신화" },
  { materials: ["아펠리오스", "레나타"], result: "세나", resultAttack: 500, resultRarity: "신화" },
  { materials: ["이렐리아", "빅토르"], result: "갈리오", resultAttack: 510, resultRarity: "신화" },
  { materials: ["사이온", "트런들"], result: "아트록스", resultAttack: 520, resultRarity: "신화" },
  { materials: ["사이온", "쓰레쉬"], result: "노틸러스", resultAttack: 530, resultRarity: "신화" },
  { materials: ["트런들", "아칼리"], result: "사일러스", resultAttack: 500, resultRarity: "신화" },
  { materials: ["아칼리", "코그모"], result: "조이", resultAttack: 510, resultRarity: "신화" },
  { materials: ["코그모", "쓰레쉬"], result: "파이크", resultAttack: 520, resultRarity: "신화" },
];

function createUnit(data: Omit<Unit, "id">): Unit {
  return {
    ...data,
    id: Date.now() + Math.random(),
  };
}

const rarityOrder: Record<Rarity, number> = {
  "신화": 0,
  "전설": 1,
  "서사": 2,
  "일반": 3,
};

const rarityStars: Record<Rarity, string> = {
  "일반": "★",
  "서사": "★★",
  "전설": "★★★",
  "신화": "★★★★",
};

function sortUnitsByRarityAndName(units: Unit[]) {
  return [...units].sort((a, b) => {
    const rarityCompare = rarityOrder[a.rarity] - rarityOrder[b.rarity];
    if (rarityCompare !== 0) return rarityCompare;
    return a.name.localeCompare(b.name, "ko");
  });
}

function UnitIcon({ rarity }: { rarity: Rarity }) {
  return <div className={`unit-icon rarity-icon rarity-${rarity}`}>{rarityStars[rarity]}</div>;
}

function getRarityStyle(rarity: Rarity) {
  if (rarity === "서사") {
    return {
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.12)",
    };
  }

  if (rarity === "전설") {
    return {
      borderColor: "#ef4444",
      backgroundColor: "rgba(239, 68, 68, 0.12)",
    };
  }

  if (rarity === "신화") {
    return {
      borderColor: "#a855f7",
      backgroundColor: "rgba(168, 85, 247, 0.14)",
    };
  }

  return {};
}

function App() {
  const [phase, setPhase] = useState<Phase>("ready");

  const [round, setRound] = useState(1);
  const [time, setTime] = useState(ROUND_TIME);

  const [owned, setOwned] = useState<Unit[]>([]);
  const [field, setField] = useState<Unit[]>([]);
  const [jungleUnit, setJungleUnit] = useState<Unit | null>(null);
  const [dragon, setDragon] = useState<Enemy | null>(null);
  const dragonRef = useRef<Enemy | null>(null);
  const dragonSpawnedRef = useRef(false);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);

  const [drawAvailable, setDrawAvailable] = useState(5);
  const lastRoundAdvancedRef = useRef<number | null>(null);

  const [kills, setKills] = useState(0);
  const killCountedEnemyIds = useRef<Set<number>>(new Set());
  const bossDefeatedRef = useRef(false);

  const [spawned, setSpawned] = useState(0);

  const [message, setMessage] = useState(
    "게임 시작 버튼을 눌러 ROUND 1을 시작하세요."
  );

  const [selectedMaterialIds, setSelectedMaterialIds] =
    useState<number[]>([]);

  enemiesRef.current = enemies;

  /*
   * =========================
   * DEVELOPER MODE
   * =========================
   *
   * 11라운드에서 시작
   * 전설 유닛 5마리를 랜덤으로 지급
   */
  const startDeveloperMode = () => {
    const legendaryData = RECIPES
      .filter((recipe) => recipe.resultRarity === "전설")
      .map((recipe) => ({
        name: recipe.result,
        rarity: recipe.resultRarity,
        attack: recipe.resultAttack,
      }));

    const shuffled = [...legendaryData].sort(
      () => Math.random() - 0.5
    );

    const developerUnits = shuffled
      .slice(0, 5)
      .map((data) => createUnit(data));

    setPhase("battle");
    setRound(11);
    setTime(ROUND_TIME);
    setDrawAvailable(0);
    lastRoundAdvancedRef.current = null;
    setSpawned(0);
    setKills(0);
    killCountedEnemyIds.current.clear();
    bossDefeatedRef.current = false;
    setEnemies([]);
    enemiesRef.current = [];
    setOwned(developerUnits);
    setField([]);
    setJungleUnit(null);
    setDragon(null);
    dragonRef.current = null;
    dragonSpawnedRef.current = false;
    setSelectedMaterialIds([]);

    setMessage(
      `개발자 모드 시작! 11라운드 + 전설 유닛 5마리 지급`
    );
  };

  /*
   * =========================
   * GAME START
   * =========================
   */

  const startGame = () => {
    setPhase("battle");
    setRound(1);
    setTime(SHORT_ROUND_TIME);
    setDrawAvailable(5);
    lastRoundAdvancedRef.current = null;
    setSpawned(0);
    setKills(0);
    killCountedEnemyIds.current.clear();
    bossDefeatedRef.current = false;
    setEnemies([]);
    enemiesRef.current = [];
    setOwned([]);
    setField([]);
    setJungleUnit(null);
    setDragon(null);
    dragonRef.current = null;
    dragonSpawnedRef.current = false;
    setSelectedMaterialIds([]);

    setMessage(
      "ROUND 1 시작! 유닛 5개를 뽑을 수 있습니다."
    );
  };

  /*
   * =========================
   * DRAW
   * =========================
   */

  const drawUnits = () => {
    if (phase !== "battle") {
      return;
    }

    if (drawAvailable <= 0) {
      setMessage("이번 라운드의 뽑기를 모두 사용했습니다.");
      return;
    }

    const newUnits: Unit[] = [];

    for (let i = 0; i < drawAvailable; i++) {
      const data =
        GENERAL_UNITS[
          Math.floor(Math.random() * GENERAL_UNITS.length)
        ];

      newUnits.push(createUnit(data));
    }

    setOwned((prev) => [...prev, ...newUnits]);
    setDrawAvailable(0);

    setMessage(
      `${newUnits.length}개 유닛을 뽑았습니다. 창고에서 좌클릭하여 전장에 배치하세요.`
    );
  };

  /*
   * =========================
   * FIELD
   * =========================
   */

  const addToField = (unit: Unit) => {
    if (phase !== "battle") {
      return;
    }

    if (field.some((f) => f.id === unit.id)) {
      return;
    }

    if (field.length >= MAX_FIELD) {
      setMessage("필드는 최대 5명까지 사용할 수 있습니다.");
      return;
    }

    setSelectedMaterialIds((prev) =>
      prev.filter((id) => id !== unit.id)
    );

    setField((prev) => [...prev, unit]);

    setMessage(`${unit.name}을(를) 필드에 배치했습니다.`);
  };

  const removeFromField = (unit: Unit) => {
    setField((prev) =>
      prev.filter((u) => u.id !== unit.id)
    );

    setMessage(`${unit.name}을(를) 필드에서 제거했습니다.`);
  };

  const addToJungle = (unit: Unit) => {
    if (phase !== "battle") return;
    if (field.some((f) => f.id === unit.id)) {
      setMessage("전장에 있는 유닛은 정글에 넣을 수 없습니다.");
      return;
    }
    setJungleUnit(unit);
    setSelectedMaterialIds((prev) => prev.filter((id) => id !== unit.id));
    setMessage(`${unit.name}을(를) 정글에 배치했습니다.`);
  };

  const removeFromJungle = () => {
    if (!jungleUnit) return;
    setMessage(`${jungleUnit.name}을(를) 정글에서 제거했습니다.`);
    setJungleUnit(null);
  };

  /*
   * =========================
   * DRAG
   * =========================
   */

  const handleDragStart = (
    e: React.DragEvent,
    unit: Unit
  ) => {
    e.dataTransfer.setData("unitId", String(unit.id));
    e.dataTransfer.effectAllowed = "move";
  };

  const getDraggedUnit = (e: React.DragEvent) => {
    const id = Number(
      e.dataTransfer.getData("unitId")
    );

    if (!id) {
      return null;
    }

    return (
      owned.find((unit) => unit.id === id) ?? null
    );
  };

  /*
   * =========================
   * FIELD DROP
   * =========================
   */

  const handleFieldDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const unit = getDraggedUnit(e);

    if (!unit) {
      return;
    }

    addToField(unit);
  };

  const handleJungleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const unit = getDraggedUnit(e);
    if (unit) addToJungle(unit);
  };

  /*
   * =========================
   * STORAGE RIGHT CLICK
   * =========================
   *
   * 창고 유닛 우클릭 → 합성 칸으로 이동
   */

  const handleStorageContextMenu = (
    e: React.MouseEvent,
    unit: Unit
  ) => {
    e.preventDefault();

    if (phase !== "battle") {
      return;
    }

    if (field.some((f) => f.id === unit.id)) {
      return;
    }

    if (selectedMaterialIds.includes(unit.id)) {
      return;
    }

    if (selectedMaterialIds.length >= 2) {
      setMessage("합성 재료는 최대 2개입니다.");
      return;
    }

    setSelectedMaterialIds((prev) => [...prev, unit.id]);
    setMessage(`${unit.name}을(를) 합성 칸에 넣었습니다.`);
  };

  /*
   * =========================
   * STORAGE
   * =========================
   */

  const fieldUnits = sortUnitsByRarityAndName(field);

  const storageUnits = sortUnitsByRarityAndName(
    owned.filter((unit) => !field.some((f) => f.id === unit.id) && jungleUnit?.id !== unit.id)
  );


  /*
   * =========================
   * COMBINE
   * =========================
   */

  const selectedMaterials = storageUnits.filter(
    (unit) =>
      selectedMaterialIds.includes(unit.id)
  );

  // 합성 칸에 유닛 1개가 들어가면, 그 유닛과 실제 합성이 가능한
  // 다른 재료들을 창고에서 강조 표시한다.
  const compatibleUnitIds = useMemo(() => {
    if (selectedMaterials.length !== 1) {
      return new Set<number>();
    }

    const selectedName = selectedMaterials[0].name;
    const compatibleNames = new Set<string>();

    RECIPES
      .filter((recipe) => recipe.materials.includes(selectedName))
      .forEach((recipe) => {
        // 같은 유닛 2개 조합도 가능하므로 selectedName 자체를
        // 재료 후보에서 제외하지 않는다.
        recipe.materials.forEach((name) => {
          compatibleNames.add(name);
        });
      });

    return new Set(
      storageUnits
        .filter(
          (unit) =>
            unit.id !== selectedMaterials[0].id &&
            compatibleNames.has(unit.name)
        )
        .map((unit) => unit.id)
    );
  }, [selectedMaterials, storageUnits]);

  const matchingRecipe = useMemo(() => {
    if (selectedMaterials.length !== 2) {
      return null;
    }

    const names = selectedMaterials
      .map((unit) => unit.name)
      .sort();

    return (
      RECIPES.find((recipe) => {
        const materials = [...recipe.materials].sort();

        return (
          materials[0] === names[0] &&
          materials[1] === names[1]
        );
      }) ?? null
    );
  }, [selectedMaterials]);

  const handleCombineDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const unit = getDraggedUnit(e);

    if (!unit) {
      return;
    }

    if (field.some((f) => f.id === unit.id)) {
      setMessage("필드에 있는 유닛은 합성할 수 없습니다.");
      return;
    }

    if (selectedMaterialIds.includes(unit.id)) {
      return;
    }

    if (selectedMaterialIds.length >= 2) {
      setMessage("합성 재료는 최대 2개입니다.");
      return;
    }

    setSelectedMaterialIds((prev) => [
      ...prev,
      unit.id,
    ]);
  };

  const removeMaterial = (unit: Unit) => {
    setSelectedMaterialIds((prev) =>
      prev.filter((id) => id !== unit.id)
    );

    setMessage(
      `${unit.name}을(를) 합성 재료에서 뺐습니다.`
    );
  };

  const combineUnits = () => {
    if (!matchingRecipe) {
      setMessage("합성 가능한 조합이 아닙니다.");
      return;
    }

    const materialIds = selectedMaterials.map(
      (unit) => unit.id
    );

    const result: Unit = {
      id: Date.now() + Math.random(),
      name: matchingRecipe.result,
      rarity: matchingRecipe.resultRarity,
      attack: matchingRecipe.resultAttack,
    };

    setOwned((prev) => [
      ...prev.filter(
        (unit) =>
          !materialIds.includes(unit.id)
      ),
      result,
    ]);

    setSelectedMaterialIds([]);

    setMessage(
      `${matchingRecipe.result} 합성 성공!`
    );
  };

  /*
   * =========================
   * JUNGLE DRAGON OBJECTIVE
   * =========================
   */

  useEffect(() => {
    if (phase !== "battle" || round < 11 || dragonSpawnedRef.current) return;

    const timer = window.setTimeout(() => {
      const newDragon: Enemy = {
        id: Date.now() + Math.random(),
        progress: 0,
        hp: DRAGON_HP,
        maxHp: DRAGON_HP,
        defense: 30,
        isBoss: false,
      };
      dragonRef.current = newDragon;
      setDragon(newDragon);
      dragonSpawnedRef.current = true;
      setMessage("🐉 11라운드부터 드래곤이 정글에 생성됩니다!");
    }, 500);

    return () => window.clearTimeout(timer);
  }, [phase, round]);

  useEffect(() => {
    if (phase !== "battle" || !jungleUnit || !dragon) return;

    const timer = window.setInterval(() => {
      const current = dragonRef.current;
      if (!current) return;

      const damage = jungleUnit.attack * (100 / (100 + current.defense)) * 0.05;
      const next = { ...current, hp: Math.max(0, current.hp - damage) };
      dragonRef.current = next;
      setDragon(next);

      if (next.hp <= 0) {
        const epicPool = RECIPES
          .filter((recipe) => recipe.resultRarity === "서사")
          .map((recipe) => ({
            name: recipe.result,
            rarity: recipe.resultRarity,
            attack: recipe.resultAttack,
          }));

        const shuffledEpicPool = [...epicPool].sort(
          () => Math.random() - 0.5
        );

        const rewards = shuffledEpicPool
          .slice(0, 2)
          .map((data) => createUnit(data));

        dragonRef.current = null;
        setDragon(null);
        setOwned((prev) => [...prev, ...rewards]);
        setMessage(
          `🐉 드래곤 처치! 서사 유닛 2개 획득: ${rewards.map((unit) => unit.name).join(", ")}`
        );
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [phase, jungleUnit]);

  /*
   * =========================
   * ROUND TIMER
   * =========================
   */

  useEffect(() => {
    if (phase !== "battle") {
      return;
    }

    const timer = window.setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          // React StrictMode 등으로 라운드 종료 처리가 중복 실행되지 않도록 방지
          if (lastRoundAdvancedRef.current === round) {
            return prev;
          }

          lastRoundAdvancedRef.current = round;

          if (round >= MAX_ROUND) {
            // 보스 라운드는 제한 시간 안에 보스를 처치해야 클리어
            if (!bossDefeatedRef.current) {
              setPhase("gameover");
              setMessage(
                "보스를 제한 시간 안에 처치하지 못했습니다. GAME OVER."
              );
              return 0;
            }

            setPhase("clear");
            setMessage(
              "20라운드 보스를 제한 시간 안에 처치했습니다!"
            );
            return 0;
          }

          const nextRound = round + 1;

          if (isBossRound(nextRound)) {
            bossDefeatedRef.current = false;
          }

          setRound(nextRound);
          setTime(nextRound <= 3 ? SHORT_ROUND_TIME : ROUND_TIME);

          /*
           * 다음 라운드 뽑기 2개를 기존 남은 횟수에 누적
           * 예: 5개를 안 썼다면 다음 라운드에는 7개
           */
          setDrawAvailable((prev) => prev + 2);

          /*
           * 해당 라운드의 생성 수 초기화
           */
          setSpawned(0);

          setSelectedMaterialIds([]);

          setMessage(
            `ROUND ${nextRound} 시작! 유닛 뽑기 기회가 2개 추가되었습니다.`
          );

          return nextRound <= 3 ? SHORT_ROUND_TIME : ROUND_TIME;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [phase, round]);

  /*
   * =========================
   * ENEMY SPAWN
   * =========================
   *
   * ROUND 1~9, 11~19
   * → 정확히 20마리
   *
   * ROUND 10, 20
   * → 보스 1마리만
   */

  useEffect(() => {
    if (phase !== "battle") {
      return;
    }

    /*
     * =========================
     * 10 ROUND
     * =========================
     *
     * 일반 몬스터 없음.
     * 보스 딱 1마리.
     */

    if (isBossRound(round)) {
      if (spawned >= 1) {
        return;
      }

      const bossTimer = window.setTimeout(() => {
        const roundData = ROUND_SETTINGS[round];
        const currentEnemies = enemiesRef.current;

        if (!roundData || currentEnemies.length >= MAX_ENEMIES) {
          return;
        }

        const boss: Enemy = {
          id: Date.now() + Math.random(),
          progress: 0,
          hp: roundData.hp,
          maxHp: roundData.hp,
          defense: roundData.defense,
          isBoss: true,
        };

        const nextEnemies = [...currentEnemies, boss];
        enemiesRef.current = nextEnemies;
        setEnemies(nextEnemies);

        setSpawned(1);

        setMessage(
          round === 10
            ? "👑 10라운드 보스 말자하가 등장했습니다!"
            : "👑 20라운드 보스 초가스가 등장했습니다!"
        );
      }, 1000);

      return () => {
        window.clearTimeout(bossTimer);
      };
    }

    /*
     * =========================
     * 1~9 ROUND
     * =========================
     *
     * 1초마다 1마리
     * 총 20마리
     */

    if (spawned >= NORMAL_ENEMIES_PER_ROUND) {
      return;
    }

    const interval = window.setInterval(() => {
      const currentEnemies = enemiesRef.current;

      if (currentEnemies.length >= MAX_ENEMIES) {
        return;
      }

      const roundData = ROUND_SETTINGS[round]!;

      const normalEnemy: Enemy = {
        id: Date.now() + Math.random(),
        progress: 0,
        hp: roundData.hp,
        maxHp: roundData.hp,
        defense: roundData.defense,
        isBoss: false,
      };

      const nextEnemies = [...currentEnemies, normalEnemy];
      enemiesRef.current = nextEnemies;
      setEnemies(nextEnemies);

      setSpawned((prev) =>
        Math.min(
          prev + 1,
          NORMAL_ENEMIES_PER_ROUND
        )
      );
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [phase, round, spawned]);

  /*
   * =========================
   * BATTLE LOOP
   * =========================
   */

  useEffect(() => {
    if (phase !== "battle") {
      return;
    }

    const loop = window.setInterval(() => {
      const currentEnemies = enemiesRef.current;

      if (currentEnemies.length === 0) {
        return;
      }

      let updated = currentEnemies.map((enemy) => ({
        ...enemy,
        progress: enemy.progress + 0.002,
      }));

      /*
       * 필드의 모든 유닛이 가장 먼저 살아있는 적을 공격
       */
      field.forEach((unit) => {
        const target = updated.find((enemy) => enemy.hp > 0);

        if (!target) {
          return;
        }

        const damage =
          unit.attack *
          (100 / (100 + target.defense)) *
          0.05;

        target.hp -= damage;
      });

      /*
       * 이번 틱에서 실제로 죽은 일반몹만 계산한다.
       * 보스는 KILLS에 포함하지 않는다.
       *
       * 중요: setState 내부에서 ref를 변경하지 않는다.
       * React StrictMode에서도 킬 수가 누락되지 않도록
       * 전투 결과를 먼저 계산한 뒤 상태에 반영한다.
       */
      const deadNormalIds = updated
        .filter(
          (enemy) =>
            enemy.hp <= 0 &&
            !enemy.isBoss &&
            !killCountedEnemyIds.current.has(enemy.id)
        )
        .map((enemy) => enemy.id);

      deadNormalIds.forEach((id) => {
        killCountedEnemyIds.current.add(id);
      });

      if (deadNormalIds.length > 0) {
        setKills((prev) => prev + deadNormalIds.length);
      }

      /* 보스가 실제로 죽었는지 기록 */
      const deadBoss = updated.some(
        (enemy) => enemy.isBoss && enemy.hp <= 0
      );

      if (deadBoss) {
        bossDefeatedRef.current = true;
      }

      /* 사망한 적 제거 */
      updated = updated.filter((enemy) => enemy.hp > 0);

      /* 길을 한 바퀴 돌면 다시 시작 */
      updated = updated.map((enemy) => ({
        ...enemy,
        progress:
          enemy.progress >= 1
            ? enemy.progress - 1
            : enemy.progress,
      }));

      /* 적 50마리 이상이면 GAME OVER */
      if (updated.length >= MAX_ENEMIES) {
        setPhase("gameover");
        setMessage("적이 50마리 쌓였습니다. GAME OVER.");
      }

      enemiesRef.current = updated;
      setEnemies(updated);
    }, 100);

    return () => {
      window.clearInterval(loop);
    };
  }, [phase, field]);

  /*
   * =========================
   * ENEMY POSITION
   * =========================
   */

  const enemyPositions = useMemo(() => {
    return enemies.map((enemy) => {
      const p = enemy.progress * 4;

      let x = 0;
      let y = 0;

      if (p < 1) {
        x = 8 + p * 84;
        y = 8;
      } else if (p < 2) {
        x = 92;
        y = 8 + (p - 1) * 84;
      } else if (p < 3) {
        x = 92 - (p - 2) * 84;
        y = 92;
      } else {
        x = 8;
        y = 92 - (p - 3) * 84;
      }

      return {
        ...enemy,
        x,
        y,
      };
    });
  }, [enemies]);

  return (
    <div className="game">
      <style>{`
        /* 모든 유닛 카드 공통 규격 - 추후 챔피언 이미지 교체를 고려한 고정 레이아웃 */
        /* 모든 유닛 카드 공통 규격
           저장소 / 정글 / 합성 / 전투 카드가 같은 크기와 내부 구조를 사용합니다. */
        .start-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .unified-unit-card {
          width: 150px !important;
          height: 165px !important;
          min-width: 150px !important;
          min-height: 165px !important;
          max-width: 150px !important;
          max-height: 165px !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          padding: 12px !important;
          overflow: hidden !important;
          flex: 0 0 150px !important;
        }

        .unified-unit-card.unit-card,
        .unified-unit-card.battle-champion,
        .unified-unit-card.jungle-slot,
        .unified-unit-card.material-slot,
        .unified-unit-card.result-slot {
          width: 150px !important;
          height: 165px !important;
          min-width: 150px !important;
          min-height: 165px !important;
          max-width: 150px !important;
          max-height: 165px !important;
          flex: 0 0 150px !important;
          box-sizing: border-box !important;
        }

        .unified-unit-card .unit-icon {
          flex: 0 0 44px !important;
          width: 44px !important;
          height: 44px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 34px !important;
          line-height: 1 !important;
        }

        .unified-unit-card strong {
          display: block !important;
          width: 100% !important;
          min-height: 24px !important;
          max-height: 48px !important;
          margin: 0 !important;
          padding: 0 !important;
          text-align: center !important;
          line-height: 1.2 !important;
          font-size: 18px !important;
          overflow: hidden !important;
          white-space: normal !important;
          word-break: keep-all !important;
          overflow-wrap: normal !important;
          text-overflow: clip !important;
        }

        .unified-unit-card small {
          display: block !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          text-align: center !important;
          line-height: 1.25 !important;
          font-size: 13px !important;
          overflow: hidden !important;
          white-space: normal !important;
          word-break: keep-all !important;
          text-overflow: clip !important;
        }

        .unified-unit-card .field-label,
        .unified-unit-card .remove-hint {
          display: block !important;
          width: 100% !important;
          text-align: center !important;
          line-height: 1.2 !important;
          font-size: 11px !important;
          white-space: normal !important;
          word-break: keep-all !important;
          overflow: hidden !important;
        }

        .unified-unit-card .drop-plus {
          flex: 0 0 auto;
          font-size: 32px;
          line-height: 1;
        }

        .unified-unit-card.combine-compatible {
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.95), 0 0 16px rgba(250, 204, 21, 0.45) !important;
          transform: translateY(-2px);
          cursor: pointer;
        }
      `}</style>

      {/* =========================
          HEADER
      ========================= */}

      <header className="header">

        <div>
          <h1>LOL RANDOM DEFENSE</h1>

          <p>
            LoL 챔피언 랜덤 디펜스
          </p>
        </div>

        <div className="stat-box">
          <span>ROUND</span>

          <strong>
            {phase === "ready"
              ? "-"
              : `${round} / ${MAX_ROUND}`}
          </strong>
        </div>

        <div className="stat-box timer-box">
          <span>TIME</span>

          <strong>
            {phase === "battle"
              ? time
              : "--"}
          </strong>
        </div>

        <div className="stat-box">
          <span>ENEMY</span>

          <strong>
            {enemies.length} / {MAX_ENEMIES}
          </strong>
        </div>

        <div className="stat-box">
          <span>KILLS</span>

          <strong>
            {kills}
          </strong>
        </div>

      </header>

      <div className="message">
        {message}
      </div>

      <main>

        {/* =========================
            READY / START
        ========================= */}

        {phase === "ready" && (
          <section className="control-panel start-panel">

            <div>
              <h2>
                LOL RANDOM DEFENSE
              </h2>

              <p>
                5명의 챔피언을 선택해
                50라운드를 방어하세요.
              </p>
            </div>

            <div className="start-buttons">
              <button
                className="start-button"
                onClick={startGame}
              >
                🎮 게임 시작
              </button>

              <button
                className="start-button"
                onClick={startDeveloperMode}
              >
                🛠 개발자 모드
              </button>
            </div>

          </section>
        )}

        {/* =========================
            BATTLE CONTROL
        ========================= */}

        {phase === "battle" && (
          <section className="control-panel">

            <div className="round-info">
              <div>
                <h2>
                  ROUND {round}
                </h2>

                <p>
                  {isBossRound(round)
                    ? "👑 보스 라운드"
                    : "일반 몬스터 라운드"}
                </p>
              </div>

              <button
                className="draw-button"
                onClick={drawUnits}
                disabled={
                  drawAvailable <= 0
                }
              >
                🎲 유닛 뽑기
                <span>
                  {drawAvailable}개
                </span>
              </button>
            </div>

            <div className="battle-status">

              <strong>
                ⚔️ 전투 중
              </strong>

              {!isBossRound(round) ? (
                <span>
                  적 생성: {spawned} / 20
                </span>
              ) : (
                <span>
                  👑 보스: {spawned} / 1
                </span>
              )}

              <span>
                KILLS: {kills}
              </span>

              <span>
                전투 중에도 유닛 변경 및 합성 가능
              </span>

            </div>

          </section>
        )}

        {/* =========================
            ARENA
        ========================= */}

        <section
          className="arena"
          onDragOver={(e) =>
            e.preventDefault()
          }
          onDrop={handleFieldDrop}
        >

          <div className="section-header">
            <h2>전장</h2>

            <span>
              ROUND {round}
            </span>
          </div>

          <div className="battle-field">

            <div className="enemy-path">

              {enemyPositions.map(
                (enemy) => (
                  <div
                    key={enemy.id}
                    className={
                      enemy.isBoss
                        ? "enemy boss"
                        : "enemy"
                    }
                    style={{
                      left: `${enemy.x}%`,
                      top: `${enemy.y}%`,
                    }}
                  >
                    <div className="enemy-visual">
                      <img
                        src={
                          enemy.isBoss
                            ? round === 10
                            ? "/malzahar-boss.png"
                            : "/chogath-boss.png"
                            : "https://static.wikia.nocookie.net/leagueoflegends/images/9/96/Order_Minion_Melee_Render.png/revision/latest?cb=20200601045237"
                        }
                        alt={enemy.isBoss ? (round === 10 ? "말자하" : "초가스") : "미니언"}
                        className={enemy.isBoss ? "enemy-image boss-image" : "enemy-image minion-image"}
                        style={{
                          width: enemy.isBoss ? 116 : 82,
                          height: enemy.isBoss ? 116 : 82,
                          objectFit: "contain",
                          display: "block",
                          objectPosition: "center",
                          filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.45))",
                        }}
                      />
                      {enemy.isBoss && (
                        <strong
                          className="boss-name"
                          style={{
                            display: "block",
                            fontSize: 11,
                            lineHeight: 1,
                            marginTop: 2,
                          }}
                        >
                          {round === 10 ? "말자하" : "초가스"}
                        </strong>
                      )}
                    </div>

                    <small>
                      {Math.ceil(
                        enemy.hp
                      )}
                    </small>

                    <small>
                      DEF {enemy.defense}
                    </small>
                  </div>
                )
              )}

              {field.map(
                (unit, index) => (
                  <button
                    key={unit.id}
                    className={`unit-card unified-unit-card battle-champion champion-${index} rarity-${unit.rarity}`} style={getRarityStyle(unit.rarity)}
                    onClick={() =>
                      removeFromField(unit)
                    }
                    title="클릭해서 필드에서 제거"
                  >
                    <UnitIcon rarity={unit.rarity} />

                    <strong>
                      {unit.name}
                    </strong>

                    <small>
                      클릭해서 제거
                    </small>
                  </button>
                )
              )}

              <div className="base">
                🏰
                <small>
                  BASE
                </small>
              </div>

            </div>

          </div>

        </section>

        {/* =========================
            JUNGLE
        ========================= */}

        <section className="panel">
          <div className="section-header">
            <h2>정글</h2>
          </div>

          <div className="field-slots">
            <div
              className={`unit-card unified-unit-card field-slot jungle-slot rarity-${jungleUnit?.rarity ?? "일반"} ${jungleUnit ? "filled" : ""}`}
              style={jungleUnit ? getRarityStyle(jungleUnit.rarity) : undefined}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleJungleDrop}
              onClick={removeFromJungle}
              onContextMenu={(e) => { e.preventDefault(); removeFromJungle(); }}
            >
              {jungleUnit ? (
                <>
                  <UnitIcon rarity={jungleUnit.rarity} />
                  <strong>{jungleUnit.name}</strong>
                  <small>{jungleUnit.rarity}</small>
                  <small>ATK {jungleUnit.attack}</small>
                  <span className="field-label">JUNGLE</span>
                </>
              ) : (
                <>
                  <span className="drop-plus">+</span>
                  <small>유닛 1명을 드래그해서 배치</small>
                </>
              )}
            </div>

            <div className="jungle-objective">
              {round < 11 ? (
                <>
                  <strong>11라운드에 드래곤 생성</strong>
                </>
              ) : dragon ? (
                <>
                  <div className="dragon-visual">🐉</div>
                  <strong>드래곤</strong>
                  <small>{Math.ceil(dragon.hp)} / {dragon.maxHp}</small>
                  <small>DEF {dragon.defense}</small>
                </>
              ) : (
                <>
                  <div className="dragon-visual defeated">✓</div>
                  <strong>드래곤 처치 완료</strong>
                  <small>오브젝트를 처치했습니다.</small>
                </>
              )}
            </div>
          </div>
        </section>

        {/* =========================
            STORAGE
        ========================= */}

        <section className="panel">

          <div className="section-header">

            <h2>창고</h2>

          </div>

          <div className="storage">

            {[...fieldUnits, ...storageUnits].map((unit) => {

              const onField =
                field.some((f) => f.id === unit.id);
              const onJungle = jungleUnit?.id === unit.id;

              const selected =
                selectedMaterialIds.includes(
                  unit.id
                );

              return (
                <div
                  key={unit.id}
                  className={`unit-card unified-unit-card rarity-${unit.rarity} ${
                    selected
                      ? "selected-material"
                      : ""
                  } ${
                    compatibleUnitIds.has(unit.id)
                      ? "combine-compatible"
                      : ""
                  } ${
                    onField || onJungle
                      ? "on-field"
                      : ""
                  }`}
                  style={getRarityStyle(unit.rarity)}
                  draggable={!onField && !onJungle}
                  onDragStart={(e) =>
                    !onField &&
                    handleDragStart(
                      e,
                      unit
                    )
                  }
                  onClick={() => {
                    if (onField) {
                      removeFromField(unit);
                    } else if (onJungle) {
                      removeFromJungle();
                    } else {
                      addToField(unit);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (onField) {
                      removeFromField(unit);
                    } else if (onJungle) {
                      removeFromJungle();
                    } else {
                      handleStorageContextMenu(e, unit);
                    }
                  }}
                >

                  <UnitIcon rarity={unit.rarity} />

                  <strong>
                    {unit.name}
                  </strong>

                  <small>
                    {unit.rarity}
                  </small>

                  <small>
                    ATK {unit.attack}
                  </small>

                  {onField && (
                    <span className="field-label">FIELD</span>
                  )}
                  {onJungle && (
                    <span className="field-label">JUNGLE</span>
                  )}

                </div>
              );
            })}

            {owned.length === 0 && (
              <div className="empty-storage">
                유닛 뽑기 버튼을 눌러주세요.
              </div>
            )}

          </div>

        </section>

        {/* =========================
            COMBINE
        ========================= */}

        <section className="combine-panel">

          <div className="section-header">

            <div>
              <h2>
                조합
              </h2>
            </div>



          </div>

          <div className="combine-area">

            <div className="material-slots">

              {[0, 1].map((index) => {

                const unit =
                  selectedMaterials[index];

                return (
                  <div
                    key={index}
                    className={`unit-card unified-unit-card material-slot rarity-${unit?.rarity ?? "일반"} ${
                      unit ? "filled" : ""
                    }`}
                    style={unit ? getRarityStyle(unit.rarity) : undefined}
                    onDragOver={(e) =>
                      e.preventDefault()
                    }
                    onDrop={handleCombineDrop}
                    onClick={() =>
                      unit &&
                      removeMaterial(unit)
                    }
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (unit) {
                        removeMaterial(unit);
                      }
                    }}
                  >

                    {unit ? (
                      <>
                        <UnitIcon rarity={unit.rarity} />

                        <strong>
                          {unit.name}
                        </strong>

                        <small>
                          {unit.rarity}
                        </small>

                        <span className="remove-hint">
                          클릭해서 제거
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="drop-plus">
                          +
                        </span>

                        <small>
                          드래그
                        </small>
                      </>
                    )}

                  </div>
                );
              })}

            </div>

            <div className="combine-arrow">
              →
            </div>

            <div
              className={`unit-card unified-unit-card result-slot ${
                matchingRecipe
                  ? `rarity-${matchingRecipe.resultRarity}`
                  : ""
              }`}
              style={
                matchingRecipe
                  ? getRarityStyle(matchingRecipe.resultRarity)
                  : undefined
              }
            >

              {matchingRecipe ? (
                <>
                  <UnitIcon rarity={matchingRecipe.resultRarity} />

                  <strong>
                    {matchingRecipe.result}
                  </strong>

                  <small>{matchingRecipe.resultRarity}</small>
                </>
              ) : (
                <>
                  <div className="unit-icon">
                    ?
                  </div>

                  <span>
                    결과
                  </span>
                </>
              )}

            </div>

            <button
              className="combine-button"
              onClick={combineUnits}
              disabled={!matchingRecipe}
            >
              합성
            </button>

          </div>

        </section>

        {/* =========================
            GAME OVER
        ========================= */}

        {phase === "gameover" && (
          <section className="control-panel gameover">

            <h2>
              GAME OVER
            </h2>

            <p>
              적이 50마리 쌓였습니다.
            </p>

            <button
              className="start-button"
              onClick={startGame}
            >
              다시 시작
            </button>

          </section>
        )}

        {/* =========================
            CLEAR
        ========================= */}

        {phase === "clear" && (
          <section className="control-panel gameover">

            <h2>
              🎉 20 ROUND CLEAR!
            </h2>

            <p>
              20라운드 보스를 처치했습니다.
            </p>

            <button
              className="start-button"
              onClick={startGame}
            >
              다시 시작
            </button>

          </section>
        )}

      </main>
    </div>
  );
}

export default App;
