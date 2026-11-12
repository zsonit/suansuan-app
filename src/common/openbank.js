// 题了个题（StudyOnTV）开源题库合并：data/banks 下的三套单选题（共 50 题）
// 来源 https://github.com/chadyi/StudyOnTV ，格式转为算算星球 choice 题型
export const OPEN_BANKS = {
  poems: { key: 'poems', name: '唐诗精选', icon: '📜', desc: '唐诗名句接龙，选下一句', items: [{"text": "床前明月光，疑是地上霜。下一句是？", "options": ["举头望明月", "低头思故乡", "疑是银河落九天", "夜来风雨声"], "answer": "举头望明月", "tip": "《静夜思》李白：床前明月光，疑是地上霜。举头望明月，低头思故乡。"}, {"text": "「春眠不觉晓」的下一句是？", "options": ["处处闻啼鸟", "夜来风雨声", "花落知多少", "白日依山尽"], "answer": "处处闻啼鸟", "tip": "《春晓》孟浩然。"}, {"text": "「白日依山尽」的下一句是？", "options": ["黄河入海流", "欲穷千里目", "更上一层楼", "一片孤城万仞山"], "answer": "黄河入海流", "tip": "《登鹳雀楼》王之涣。"}, {"text": "「欲穷千里目」的下一句是？", "options": ["更上一层楼", "黄河入海流", "白日依山尽", "春风吹又生"], "answer": "更上一层楼", "tip": "《登鹳雀楼》王之涣。"}, {"text": "「离离原上草」的下一句是？", "options": ["一岁一枯荣", "野火烧不尽", "春风吹又生", "远芳侵古道"], "answer": "一岁一枯荣", "tip": "《草》白居易。"}, {"text": "「野火烧不尽」的下一句是？", "options": ["春风吹又生", "一岁一枯荣", "远芳侵古道", "晴翠接荒城"], "answer": "春风吹又生", "tip": "《草》白居易。"}, {"text": "「谁知盘中餐」的下一句是？", "options": ["粒粒皆辛苦", "锄禾日当午", "汗滴禾下土", "春种一粒粟"], "answer": "粒粒皆辛苦", "tip": "《悯农》李绅。"}, {"text": "「两个黄鹂鸣翠柳」的下一句是？", "options": ["一行白鹭上青天", "窗含西岭千秋雪", "门泊东吴万里船", "孤帆远影碧空尽"], "answer": "一行白鹭上青天", "tip": "《绝句》杜甫。"}, {"text": "《静夜思》的作者是谁？", "options": ["李白", "杜甫", "白居易", "王维"], "answer": "李白", "tip": "李白，字太白，号青莲居士。"}, {"text": "《春晓》的作者是谁？", "options": ["孟浩然", "李白", "杜牧", "李商隐"], "answer": "孟浩然", "tip": "孟浩然，唐代山水田园诗人。"}] },
  math100: { key: 'math100', name: '100以内加减法', icon: '🧮', desc: '两位数加减法四选一', items: [{"text": "42 - 26 = ?", "options": ["18", "7", "6", "16"], "answer": "16", "tip": "答案是 16。"}, {"text": "5 + 54 = ?", "options": ["59", "68", "58", "50"], "answer": "59", "tip": "答案是 59。"}, {"text": "29 - 19 = ?", "options": ["9", "19", "10", "0"], "answer": "10", "tip": "答案是 10。"}, {"text": "38 + 35 = ?", "options": ["73", "71", "74", "64"], "answer": "73", "tip": "答案是 73。"}, {"text": "48 + 46 = ?", "options": ["93", "84", "85", "94"], "answer": "94", "tip": "答案是 94。"}, {"text": "41 + 30 = ?", "options": ["71", "72", "70", "73"], "answer": "71", "tip": "答案是 71。"}, {"text": "11 - 9 = ?", "options": ["12", "3", "4", "2"], "answer": "2", "tip": "答案是 2。"}, {"text": "22 - 5 = ?", "options": ["7", "26", "27", "17"], "answer": "17", "tip": "答案是 17。"}, {"text": "44 - 39 = ?", "options": ["15", "5", "14", "6"], "answer": "5", "tip": "答案是 5。"}, {"text": "46 + 8 = ?", "options": ["44", "54", "64", "53"], "answer": "54", "tip": "答案是 54。"}, {"text": "51 + 32 = ?", "options": ["81", "74", "83", "93"], "answer": "83", "tip": "答案是 83。"}, {"text": "18 - 18 = ?", "options": ["1", "2", "0", "9"], "answer": "0", "tip": "答案是 0。"}, {"text": "11 + 30 = ?", "options": ["40", "51", "31", "41"], "answer": "41", "tip": "答案是 41。"}, {"text": "1 + 69 = ?", "options": ["72", "68", "70", "60"], "answer": "70", "tip": "答案是 70。"}, {"text": "51 + 7 = ?", "options": ["68", "67", "48", "58"], "answer": "58", "tip": "答案是 58。"}, {"text": "57 + 22 = ?", "options": ["70", "79", "69", "77"], "answer": "79", "tip": "答案是 79。"}, {"text": "10 - 10 = ?", "options": ["1", "0", "9", "2"], "answer": "0", "tip": "答案是 0。"}, {"text": "15 - 8 = ?", "options": ["7", "17", "5", "8"], "answer": "7", "tip": "答案是 7。"}, {"text": "95 + 2 = ?", "options": ["87", "96", "99", "97"], "answer": "97", "tip": "答案是 97。"}, {"text": "98 - 83 = ?", "options": ["6", "16", "15", "17"], "answer": "15", "tip": "答案是 15。"}, {"text": "69 - 65 = ?", "options": ["13", "6", "3", "4"], "answer": "4", "tip": "答案是 4。"}, {"text": "46 - 2 = ?", "options": ["43", "54", "44", "45"], "answer": "44", "tip": "答案是 44。"}, {"text": "47 + 7 = ?", "options": ["53", "64", "54", "56"], "answer": "54", "tip": "答案是 54。"}, {"text": "62 - 23 = ?", "options": ["30", "38", "48", "39"], "answer": "39", "tip": "答案是 39。"}, {"text": "82 + 13 = ?", "options": ["85", "95", "86", "93"], "answer": "95", "tip": "答案是 95。"}, {"text": "84 + 16 = ?", "options": ["100", "98", "90", "91"], "answer": "100", "tip": "答案是 100。"}, {"text": "28 + 28 = ?", "options": ["56", "57", "55", "58"], "answer": "56", "tip": "答案是 56。"}, {"text": "17 + 46 = ?", "options": ["63", "72", "61", "73"], "answer": "63", "tip": "答案是 63。"}, {"text": "57 - 39 = ?", "options": ["16", "28", "18", "8"], "answer": "18", "tip": "答案是 18。"}, {"text": "42 - 34 = ?", "options": ["18", "9", "7", "8"], "answer": "8", "tip": "答案是 8。"}] },
  english: { key: 'english', name: '英语基础', icon: '🔤', desc: '单词和日常用语', items: [{"text": "“苹果”用英语怎么说？", "options": ["apple", "banana", "orange", "pear"], "answer": "apple", "tip": "apple 苹果。"}, {"text": "“谢谢”用英语怎么说？", "options": ["Sorry", "Thank you", "Hello", "Goodbye"], "answer": "Thank you", "tip": "Thank you，谢谢。"}, {"text": "“图书馆”用英语怎么说？", "options": ["lab", "library", "bookstore", "school"], "answer": "library", "tip": "library 图书馆。"}, {"text": "“星期一”用英语怎么说？", "options": ["Sunday", "Monday", "Tuesday", "Friday"], "answer": "Monday", "tip": "Monday 星期一。"}, {"text": "“我喜欢读书”正确的说法是？", "options": ["I like read books.", "I likes reading books.", "I like reading books.", "I liking read books."], "answer": "I like reading books.", "tip": "like doing sth：I like reading books."}, {"text": "“She ___ to school by bus.” 应该填？", "options": ["go", "goes", "going", "gone"], "answer": "goes", "tip": "第三人称单数动词加 es。"}, {"text": "“cat”的复数形式是？", "options": ["cat", "cates", "cats", "caties"], "answer": "cats", "tip": "一般名词加 s。"}, {"text": "“big”的反义词是？", "options": ["small", "tall", "long", "fat"], "answer": "small", "tip": "big 大 ↔ small 小。"}, {"text": "“How old are you?” 是什么意思？", "options": ["你多大了？", "你在哪里？", "你叫什么？", "你好吗？"], "answer": "你多大了？", "tip": "How old are you? 你几岁了？"}, {"text": "“早餐”用英语怎么说？", "options": ["lunch", "dinner", "breakfast", "supper"], "answer": "breakfast", "tip": "breakfast 早餐。"}] },
}

export const OPEN_GROUP = {
  key: 'open',
  name: '题了个题 · 开放题库',
  icon: '🎓',
  desc: '来自开源项目 StudyOnTV 的单选题库，答对解锁观看时间'
}

// 随机抽 count 道题（choice 题型）
export function openGenerate(bankKey, count) {
  const bank = OPEN_BANKS[bankKey]
  if (!bank) return []
  const pool = [...bank.items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(count, pool.length)).map((it) => ({
    type: 'choice',
    text: it.text,
    options: it.options,
    answer: it.answer,
    tip: it.tip,
    mode: 'O_' + bankKey
  }))
}
