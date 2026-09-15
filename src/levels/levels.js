/** Декларативные шаблоны уровней. Рабочие идентификаторы назначаются при запуске игры. */
export const levelConfigs = [
  {
    id: 1,
    name: 'Первый росток',
    subtitle: 'Каждый сад начинается с маленького чуда',
    rows: 7,
    cols: 7,
    colors: 4,
    moves: 24,
    goals: [
      {
        key: 'color:0',
        count: 18,
      },
      {
        key: 'color:2',
        count: 18,
      },
    ],
    placements: [
      [0, 0, 0],
      [0, 1, 1],
      [
        6,
        6,
        {
          kind: 'booster',
          type: 'line',
          axis: 'h',
        },
      ],
    ],
  },
  {
    id: 2,
    name: 'Лимонная аллея',
    subtitle: 'Собирайте длинные ряды и создавайте бустеры',
    rows: 7,
    cols: 8,
    colors: 4,
    moves: 26,
    goals: [
      {
        key: 'color:1',
        count: 30,
      },
      {
        key: 'booster',
        count: 3,
      },
    ],
    placements: [
      [
        5,
        1,
        {
          kind: 'booster',
          type: 'line',
          axis: 'v',
        },
      ],
      [
        5,
        6,
        {
          kind: 'booster',
          type: 'bomb',
          axis: 'h',
        },
      ],
    ],
  },
  {
    id: 3,
    name: 'Старый дворик',
    subtitle: 'Матчи рядом разбивают деревянные ящики',
    rows: 8,
    cols: 8,
    colors: 4,
    moves: 28,
    goals: [
      {
        key: 'box',
        count: 8,
      },
      {
        key: 'color:0',
        count: 25,
      },
    ],
    placements: [
      [
        2,
        2,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        2,
        3,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        2,
        4,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        2,
        5,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        5,
        2,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        5,
        3,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        5,
        4,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        5,
        5,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
    ],
  },
  {
    id: 4,
    name: 'Цветочная мастерская',
    subtitle: 'Цветные ящики любят совпадения своего цвета',
    rows: 8,
    cols: 8,
    colors: 5,
    moves: 30,
    goals: [
      {
        key: 'box:colored',
        count: 6,
      },
      {
        key: 'color:3',
        count: 24,
      },
    ],
    placements: [
      [
        2,
        1,
        {
          kind: 'box',
          type: 'colored',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        2,
        3,
        {
          kind: 'box',
          type: 'colored',
          hp: 1,
          color: 1,
          contains: null,
        },
      ],
      [
        2,
        5,
        {
          kind: 'box',
          type: 'colored',
          hp: 1,
          color: 2,
          contains: null,
        },
      ],
      [
        5,
        2,
        {
          kind: 'box',
          type: 'colored',
          hp: 1,
          color: 3,
          contains: null,
        },
      ],
      [
        5,
        4,
        {
          kind: 'box',
          type: 'colored',
          hp: 1,
          color: 4,
          contains: null,
        },
      ],
      [
        5,
        6,
        {
          kind: 'box',
          type: 'colored',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
    ],
  },
  {
    id: 5,
    name: 'Секрет оранжереи',
    subtitle: 'Под крышкой может скрываться ещё один сюрприз',
    rows: 8,
    cols: 8,
    colors: 5,
    moves: 32,
    goals: [
      {
        key: 'box',
        count: 10,
      },
      {
        key: 'booster:bomb',
        count: 2,
      },
    ],
    placements: [
      [
        2,
        2,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: {
            kind: 'box',
            type: 'wood',
            hp: 1,
            color: 0,
            contains: null,
          },
        },
      ],
      [
        2,
        5,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: {
            kind: 'box',
            type: 'wood',
            hp: 1,
            color: 0,
            contains: null,
          },
        },
      ],
      [
        5,
        2,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: {
            kind: 'box',
            type: 'wood',
            hp: 1,
            color: 0,
            contains: null,
          },
        },
      ],
      [
        5,
        5,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: {
            kind: 'box',
            type: 'wood',
            hp: 1,
            color: 0,
            contains: null,
          },
        },
      ],
      [
        3,
        3,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: {
            kind: 'booster',
            type: 'bomb',
            axis: 'h',
          },
        },
      ],
      [
        4,
        4,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: {
            kind: 'booster',
            type: 'bomb',
            axis: 'h',
          },
        },
      ],
    ],
  },
  {
    id: 6,
    name: 'Сад перемен',
    subtitle: 'Ящики меняют цвет после каждого удачного хода',
    rows: 8,
    cols: 8,
    colors: 5,
    moves: 32,
    goals: [
      {
        key: 'box:cycling',
        count: 6,
      },
      {
        key: 'color:4',
        count: 25,
      },
    ],
    placements: [
      [
        2,
        1,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        2,
        3,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 1,
          contains: null,
        },
      ],
      [
        2,
        5,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 2,
          contains: null,
        },
      ],
      [
        5,
        2,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 3,
          contains: null,
        },
      ],
      [
        5,
        4,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 4,
          contains: null,
        },
      ],
      [
        5,
        6,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        0,
        0,
        {
          kind: 'booster',
          type: 'rainbow',
          axis: 'h',
        },
      ],
    ],
  },
  {
    id: 7,
    name: 'Каменный лабиринт',
    subtitle: 'Фишки падают между неподвижными камнями',
    rows: 9,
    cols: 8,
    colors: 5,
    moves: 34,
    goals: [
      {
        key: 'box:wood',
        count: 8,
      },
      {
        key: 'color:1',
        count: 30,
      },
    ],
    placements: [
      [
        2,
        2,
        {
          kind: 'box',
          type: 'blocker',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        2,
        5,
        {
          kind: 'box',
          type: 'blocker',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        6,
        2,
        {
          kind: 'box',
          type: 'blocker',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        6,
        5,
        {
          kind: 'box',
          type: 'blocker',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        1,
        1,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        1,
        6,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        3,
        1,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        3,
        6,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        5,
        1,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        5,
        6,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        7,
        1,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        7,
        6,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
    ],
  },
  {
    id: 8,
    name: 'Воздушная почта',
    subtitle: 'Самолётики находят то, что нужно вашим целям',
    rows: 8,
    cols: 9,
    colors: 5,
    moves: 32,
    goals: [
      {
        key: 'booster:plane',
        count: 5,
      },
      {
        key: 'box',
        count: 6,
      },
    ],
    placements: [
      [
        0,
        0,
        {
          kind: 'booster',
          type: 'plane',
          axis: 'h',
        },
      ],
      [
        0,
        1,
        {
          kind: 'booster',
          type: 'plane',
          axis: 'h',
        },
      ],
      [
        7,
        7,
        {
          kind: 'booster',
          type: 'plane',
          axis: 'h',
        },
      ],
      [
        7,
        8,
        {
          kind: 'booster',
          type: 'rainbow',
          axis: 'h',
        },
      ],
      [
        2,
        1,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        5,
        2,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        2,
        3,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        5,
        4,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        2,
        5,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
      [
        5,
        6,
        {
          kind: 'box',
          type: 'wood',
          hp: 1,
          color: 0,
          contains: null,
        },
      ],
    ],
  },
  {
    id: 9,
    name: 'Радужный фонтан',
    subtitle: 'Соедините радужный шар с другим бустером',
    rows: 9,
    cols: 9,
    colors: 6,
    moves: 36,
    goals: [
      {
        key: 'box',
        count: 10,
      },
      {
        key: 'booster',
        count: 12,
      },
      {
        key: 'color:5',
        count: 25,
      },
    ],
    placements: [
      [
        0,
        0,
        {
          kind: 'booster',
          type: 'rainbow',
          axis: 'h',
        },
      ],
      [
        0,
        1,
        {
          kind: 'booster',
          type: 'line',
          axis: 'h',
        },
      ],
      [
        8,
        7,
        {
          kind: 'booster',
          type: 'bomb',
          axis: 'h',
        },
      ],
      [
        8,
        8,
        {
          kind: 'booster',
          type: 'plane',
          axis: 'h',
        },
      ],
      [
        2,
        2,
        {
          kind: 'box',
          type: 'colored',
          hp: 2,
          color: 2,
          contains: null,
        },
      ],
      [
        2,
        6,
        {
          kind: 'box',
          type: 'cycling',
          hp: 1,
          color: 2,
          contains: {
            kind: 'box',
            type: 'wood',
            hp: 1,
            color: 0,
            contains: null,
          },
        },
      ],
      [
        4,
        2,
        {
          kind: 'box',
          type: 'colored',
          hp: 2,
          color: 4,
          contains: null,
        },
      ],
      [
        4,
        6,
        {
          kind: 'box',
          type: 'cycling',
          hp: 1,
          color: 4,
          contains: {
            kind: 'box',
            type: 'wood',
            hp: 1,
            color: 0,
            contains: null,
          },
        },
      ],
      [
        6,
        2,
        {
          kind: 'box',
          type: 'colored',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
      [
        6,
        6,
        {
          kind: 'box',
          type: 'cycling',
          hp: 1,
          color: 0,
          contains: {
            kind: 'box',
            type: 'wood',
            hp: 1,
            color: 0,
            contains: null,
          },
        },
      ],
      [
        4,
        4,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: null,
        },
      ],
    ],
  },
  {
    id: 10,
    name: 'Сад мечты',
    subtitle: 'Последний штрих вашей цветущей истории',
    rows: 9,
    cols: 9,
    colors: 6,
    moves: 40,
    goals: [
      {
        key: 'box',
        count: 14,
      },
      {
        key: 'booster',
        count: 15,
      },
      {
        key: 'color:2',
        count: 35,
      },
    ],
    placements: [
      [
        0,
        0,
        {
          kind: 'booster',
          type: 'rainbow',
          axis: 'h',
        },
      ],
      [
        0,
        1,
        {
          kind: 'booster',
          type: 'rainbow',
          axis: 'h',
        },
      ],
      [
        4,
        4,
        {
          kind: 'box',
          type: 'blocker',
          hp: 3,
          color: 0,
          contains: {
            kind: 'box',
            type: 'wood',
            hp: 1,
            color: 0,
            contains: null,
          },
        },
      ],
      [
        2,
        1,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: {
            kind: 'box',
            type: 'colored',
            hp: 1,
            color: 0,
            contains: {
              kind: 'booster',
              type: 'plane',
              axis: 'h',
            },
          },
        },
      ],
      [
        2,
        3,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 1,
          contains: {
            kind: 'box',
            type: 'colored',
            hp: 1,
            color: 1,
            contains: {
              kind: 'booster',
              type: 'plane',
              axis: 'h',
            },
          },
        },
      ],
      [
        2,
        5,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 2,
          contains: {
            kind: 'box',
            type: 'colored',
            hp: 1,
            color: 2,
            contains: {
              kind: 'booster',
              type: 'plane',
              axis: 'h',
            },
          },
        },
      ],
      [
        2,
        7,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 3,
          contains: null,
        },
      ],
      [
        6,
        1,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 0,
          contains: {
            kind: 'box',
            type: 'colored',
            hp: 1,
            color: 0,
            contains: {
              kind: 'booster',
              type: 'plane',
              axis: 'h',
            },
          },
        },
      ],
      [
        6,
        3,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 1,
          contains: {
            kind: 'box',
            type: 'colored',
            hp: 1,
            color: 1,
            contains: {
              kind: 'booster',
              type: 'plane',
              axis: 'h',
            },
          },
        },
      ],
      [
        6,
        5,
        {
          kind: 'box',
          type: 'wood',
          hp: 2,
          color: 2,
          contains: {
            kind: 'box',
            type: 'colored',
            hp: 1,
            color: 2,
            contains: {
              kind: 'booster',
              type: 'plane',
              axis: 'h',
            },
          },
        },
      ],
      [
        6,
        7,
        {
          kind: 'box',
          type: 'cycling',
          hp: 2,
          color: 3,
          contains: null,
        },
      ],
    ],
  },
];
