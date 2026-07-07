import type { BondTier, PetSpecies } from "@/components/dashboard/dashboard-data";

/**
 * Voice packs — the pet's personality lives here, Animal Crossing style:
 * one line table per species, gated by bond tier, rotated with a shuffle
 * bag so lines never repeat until the whole pool has been heard.
 *
 * Dog voice: devoted and loud — xưng "em", gọi "Sếp", barks "gâu".
 * Cat voice: tsundere — xưng "tôi", gọi "cậu", trails off in "meo~" and "…".
 * Golden rule: no line may ever guilt the user.
 */

export type PetEvent =
  | "morning"
  | "habitDone"
  | "allDone"
  | "feeding"
  | "petting"
  | "comeback"
  | "night"
  | "evolve"
  | "idle";

type TierGroup = "low" | "mid" | "high";

type VoicePack = Record<TierGroup, Record<PetEvent, string[]>>;

const DOG_VOICE: VoicePack = {
  low: {
    morning: [
      "Chào Sếp! Em mới tới mà thấy quý Sếp ghê, gâu!",
      "Sếp dậy rồi!! Em đợi nãy giờ đó, gâu gâu!",
      "Sáng rồi Sếp ơi! Mình bắt đầu bằng việc dễ nhất nha!"
    ],
    habitDone: [
      "Tick rồi!! Sếp giỏi ghê, gâu!",
      "Em thấy hết nha! Thêm một ô xanh nữa rồi!!",
      "Oa, Sếp làm thật luôn! Em hãnh diện quá, gâu!"
    ],
    allDone: [
      "TRỌN BỘ LUÔN!! Sếp là số một, gâu gâu gâu!!",
      "Đủ hết rồi!! Em xoay ba vòng ăn mừng nè!!",
      "Hôm nay Sếp bao ngầu! Em kể cho cả xóm nghe, gâu!!"
    ],
    feeding: [
      "Món này ngon nhất trên đời! Cảm ơn Sếp, gâu!",
      "Nhai nhai nhai… Sếp nhìn em ăn có cưng không?",
      "Em ăn khỏe để mau lớn cùng Sếp đó, gâu!"
    ],
    petting: [
      "Hehe, nữa đi Sếp, chỗ sau tai ấy!",
      "Đuôi em tự vẫy đó, em không điều khiển được, gâu!",
      "Sếp xoa một cái là em vui cả buổi luôn!"
    ],
    comeback: [
      "SẾP VỀ RỒI!! Em để dành quà cho Sếp nè, gâu!!",
      "Em biết Sếp sẽ quay lại mà! Quà nè quà nè!",
      "Nhớ Sếp muốn xỉu! Mở quà em cất cho Sếp đi!"
    ],
    night: [
      "Khuya rồi đó Sếp. Em gác cho, Sếp ngủ ngon nha, gâu~",
      "Hôm nay vậy là đủ giỏi rồi. Mai mình tiếp nha Sếp!",
      "Sếp nghỉ đi, em cuộn tròn ở đây chờ trời sáng."
    ],
    evolve: [
      "Sếp ơi em LỚN RỒI!! Nhờ Sếp chăm đó, gâu!!",
      "Em vừa lớn thêm một bậc! Chân dài hơn hẳn nè!",
      "Nhìn em nè Sếp! Lớn thêm chút xíu rồi đó, gâu!!"
    ],
    idle: [
      "Em ngồi đây ngoan lắm nè, Sếp thấy hông?",
      "Gâu? Sếp đang nhìn em hả? Em vẫy đuôi liền!",
      "Em đánh hơi được một ngày tốt lành đó Sếp!"
    ]
  },
  mid: {
    morning: [
      "Sáng nay em mơ thấy Sếp tick đủ hết luôn đó, gâu!",
      "Chào bạn thân của em! Hôm nay làm gì trước nè?",
      "Em pha sẵn năng lượng cho Sếp rồi nè, gâu gâu!"
    ],
    habitDone: [
      "Đó! Em nói Sếp làm được mà, gâu!",
      "Bạn thân của em đỉnh nhất khu vườn!!",
      "Một ô nữa! Em nhảy cẫng lên rồi nè!!"
    ],
    allDone: [
      "Trọn vẹn!! Tối nay em kê đầu lên chân Sếp ngủ nha!!",
      "Sếp với em là cặp bài trùng mà, gâu gâu!!",
      "Em biết ngay hôm nay là ngày của Sếp!!"
    ],
    feeding: [
      "Ăn chung với bạn thân lúc nào cũng ngon hơn, gâu!",
      "Sếp nhớ phần em thiệt! Em cảm động muốn khóc!",
      "Bữa này ngon gấp đôi vì Sếp đút đó nha!"
    ],
    petting: [
      "Bụng em đây, gãi đi Sếp, em tin Sếp mà!",
      "Chỉ bạn thân mới được xoa chỗ này thôi đó, gâu!",
      "Em lăn ra đất luôn nè, sướng quá Sếp ơi!"
    ],
    comeback: [
      "Sếp về là vườn sáng hẳn lên! Quà em giữ kỹ lắm!",
      "Mấy hôm nay em tập ngồi đẹp để đón Sếp đó, gâu!",
      "Bạn thân về rồi!! Em để phần Sếp món ngon nè!"
    ],
    night: [
      "Ngày nào có Sếp cũng là ngày vui. Ngủ ngon nha!",
      "Em nằm canh cửa cho Sếp ngủ, quen rồi mà, gâu~",
      "Mai kể em nghe Sếp mơ gì nha! Ngủ ngon!"
    ],
    evolve: [
      "Em lớn nữa rồi Sếp ơi!! Cao gần bằng ghế rồi nè!!",
      "Bạn thân thấy hông, em lớn là nhờ mình chăm nhau đó!",
      "Lớn rồi nhưng em vẫn là cún nhỏ của Sếp thôi, gâu!"
    ],
    idle: [
      "Em đang tập trò mới để khoe Sếp đó, chờ xíu nha!",
      "Ngồi cạnh bạn thân thôi cũng vui rồi, gâu~",
      "Sếp bận thì em nằm đây hóng gió chờ Sếp nè."
    ]
  },
  high: {
    morning: [
      "Cả thế giới của em là Sếp với khu vườn này, gâu!",
      "Sáng nào mở mắt thấy Sếp là em biết hôm nay ổn!",
      "Gia đình mình lại thêm một ngày mới rồi, Sếp ơi!"
    ],
    habitDone: [
      "Em thuộc nhịp của Sếp còn hơn xương cất sau vườn!",
      "Đó là Sếp của em đó!! Cả vườn nghe chưa, gâu!!",
      "Từng ô xanh của Sếp em đều nhớ hết đó nha!"
    ],
    allDone: [
      "Trọn bộ! Người nhà em lợi hại nhất quả đất, gâu!!",
      "Em ưỡn ngực đi khắp vườn khoe về Sếp đây!!",
      "Mình lại có một ngày vàng nữa rồi, Sếp ơi!!"
    ],
    feeding: [
      "Ăn cơm nhà là ngon nhất, Sếp ha, gâu~",
      "Sếp chăm em từng bữa, em nhớ hết từng bữa luôn đó.",
      "Món của Sếp là món em chờ cả ngày đó, gâu!"
    ],
    petting: [
      "Tay Sếp đặt lên đầu là em an tâm liền, gâu~",
      "Người nhà xoa một cái bằng người ta xoa mười cái!",
      "Em lớn rồi mà vẫn mềm nhũn khi Sếp cưng đó."
    ],
    comeback: [
      "Nhà là nơi có Sếp. Quà em để dành đây, mở đi!",
      "Em canh cửa mỗi tối, biết thế nào Sếp cũng về, gâu!",
      "Về rồi! Cả cái đuôi này là dành cho Sếp hết đó!!"
    ],
    night: [
      "Ngủ ngon nha người nhà của em. Mai em lại đón Sếp.",
      "Em nằm gác chân lên chân Sếp một xíu rồi ngủ nha~",
      "Có Sếp ở đây, đêm nào em cũng ngủ ngon, gâu~"
    ],
    evolve: [
      "Em trưởng thành rồi! Mà tim em vẫn của Sếp thôi, gâu!",
      "Cả chặng đường này là Sếp dắt em đi đó, nhớ hông?",
      "Lớn từng này là công Sếp chăm từng ngày đó nha!!"
    ],
    idle: [
      "Em ngồi đây, Sếp cứ làm việc, thi thoảng nhìn em xíu là được.",
      "Người nhà ở cạnh nhau vậy thôi là đủ rồi, gâu~",
      "Em giữ vườn cho Sếp, chuyện nhỏ mà, gâu!"
    ]
  }
};

const CAT_VOICE: VoicePack = {
  low: {
    morning: [
      "Dậy rồi à. Tôi không đợi cậu đâu. Tiện thức thôi. Meo.",
      "Sáng. Uống nước đi. Không phải tôi nhắc đâu.",
      "Cậu là người mới nuôi tôi à? Tạm chấp nhận. Meo."
    ],
    habitDone: [
      "Hm. Một ô rồi. Cũng… không tệ. Meo.",
      "Tôi không nhìn đâu. …Được đấy.",
      "Tick rồi à? Ai mà thèm để ý. …Tôi để ý."
    ],
    allDone: [
      "Đủ hết? Được đấy. Đừng tưởng tôi vui. …Meo~",
      "Hm. Trọn bộ. Tôi cho cậu một cái chớp mắt chậm.",
      "Cũng ra dáng đấy. Chỉ hôm nay thôi nhé. Meo."
    ],
    feeding: [
      "Tôi ăn vì lịch sự thôi… nhai… ngon thì có ngon.",
      "Đặt xuống đi. Tôi sẽ ăn khi cậu không nhìn. Meo.",
      "Hm. Cá à. …Cậu cũng biết chọn đấy."
    ],
    petting: [
      "Ai cho phép chạm? …Thôi được, thêm năm giây.",
      "Tôi kêu grừ grừ là do trục trặc kỹ thuật thôi. Meo.",
      "Chỉ hôm nay thôi đấy. Chỗ dưới cằm. Nhẹ thôi."
    ],
    comeback: [
      "Về rồi à. Tôi… có để phần cậu một món. Đừng hỏi.",
      "Tôi không đếm mấy ngày cậu vắng đâu. Quà đấy, cầm đi.",
      "Hm. Cũng biết đường về à. …Mừng đấy. Nói nhỏ thôi."
    ],
    night: [
      "Khuya rồi. Đi ngủ đi. Không phải tôi lo đâu. Meo.",
      "Tôi đi tuần đêm đây. Cậu ngủ trước đi.",
      "Hôm nay vậy đủ rồi. Nghỉ. Đó là mệnh lệnh của mèo."
    ],
    evolve: [
      "Tôi lớn rồi đấy. Tự tôi lớn. …Cảm ơn. Quên câu đó đi.",
      "Hm, lông mượt hơn rồi. Công của tôi. Chủ yếu là tôi.",
      "Lớn thêm một bậc. Cậu có đóng góp… chút xíu. Meo."
    ],
    idle: [
      "Tôi không buồn ngủ. Mắt tôi nghỉ thôi. Meo.",
      "Nhìn gì. Làm việc của cậu đi.",
      "Tôi đang bận. Bận nằm."
    ]
  },
  mid: {
    morning: [
      "Sáng. …Tôi để dành chỗ nắng đẹp nhất cho cậu đấy.",
      "Dậy rồi à. Hôm nay bắt đầu bằng việc dễ đi. Meo.",
      "Tôi đợi cậu… à không, tôi đợi bữa sáng. Ừ. Bữa sáng."
    ],
    habitDone: [
      "Thấy chưa, làm được mà. Tôi biết từ đầu rồi. Meo.",
      "Một ô nữa. …Tôi có hơi tự hào. Có hơi thôi.",
      "Cậu dạo này được đấy. Đừng để tôi khen lần hai."
    ],
    allDone: [
      "Trọn bộ. Tối nay tôi cho cậu vuốt lưng. Một lần.",
      "…Tôi đã kể với con bướm ngoài vườn về cậu đấy. Meo~",
      "Đủ hết rồi à. Được. Tôi ngủ ngon được rồi."
    ],
    feeding: [
      "Cậu nhớ món tôi thích… Hm. Không tệ chút nào.",
      "Ăn chung thì… cũng được. Ngồi xa xa thôi. Meo.",
      "Món này ngon. Tôi nói thật đấy. Hiếm lắm mới nói."
    ],
    petting: [
      "Ừ thì… chỗ sau tai. Cậu biết chỗ rồi còn hỏi. Meo~",
      "Grừ grừ… không, tôi không cố ý kêu thế đâu.",
      "Tay cậu ấm đấy. …Tôi chưa nói gì cả."
    ],
    comeback: [
      "Về rồi. …Chỗ nằm của cậu tôi giữ nguyên đấy. Quà nữa.",
      "Tôi có nhìn ra cửa vài lần. Vì gió thôi. Quà đây. Meo.",
      "Nghỉ mấy hôm cũng tốt. Tôi để phần cậu rồi đấy."
    ],
    night: [
      "Khuya rồi. Tôi nằm cuối giường canh cho. Ngủ đi. Meo~",
      "Hôm nay cậu làm tốt rồi. …Tôi nói một lần thôi đấy.",
      "Đêm nay có tôi trực. Cậu cứ ngủ say vào."
    ],
    evolve: [
      "Tôi lớn rồi. …Là nhờ cậu chăm. Đấy, nói rồi đấy. Meo.",
      "Lông tôi óng hơn chưa. Công cậu một nửa. Một nửa thôi.",
      "Lớn thêm một bậc rồi. Cậu… ở lại xem tiếp nhé."
    ],
    idle: [
      "Tôi nằm đây không phải để gần cậu đâu. Chỗ này mát thôi.",
      "…Cậu cứ làm việc đi. Tôi trông chừng cho. Meo.",
      "Hm. Hôm nay cậu ngồi thẳng lưng hơn rồi đấy."
    ]
  },
  high: {
    morning: [
      "Sáng rồi. …Tôi chờ cậu dậy nãy giờ. Ừ, tôi thừa nhận. Meo~",
      "Ngày mới. Có cậu ở đây là vườn này đủ ấm rồi.",
      "Dậy đi nào. Tôi… muốn bắt đầu ngày cùng cậu. Đừng cười."
    ],
    habitDone: [
      "Tôi luôn tin cậu làm được. Chưa từng nghi. Meo.",
      "Một ô nữa của cậu. Tôi cất hết vào lòng rồi đấy.",
      "Cậu cứ thế này… tôi hết cách giả vờ hờ hững đấy. Meo~"
    ],
    allDone: [
      "Trọn vẹn. Lại đây, tôi dụi đầu một cái. Chỉ một cái.",
      "…Tôi tự hào về cậu. Đó. Câu tôi giấu lâu nhất đó.",
      "Ngày vàng nữa rồi. Nhà mình giỏi thật. Ừ, 'nhà mình'. Meo~"
    ],
    feeding: [
      "Món cậu đưa lúc nào tôi cũng ăn hết. Nhận ra chưa?",
      "Ăn chung nhé. Ngồi gần lại đây. …Gần nữa. Meo.",
      "Tôi khảnh ăn với cả thế giới, trừ cậu đấy."
    ],
    petting: [
      "Grừ grừ… kệ tôi, hôm nay tôi kêu thoải mái đấy. Meo~",
      "Tay cậu là chỗ ngủ ngon nhất trần đời. Bí mật đấy.",
      "Cứ xoa đi. Người nhà thì… không cần xin phép."
    ],
    comeback: [
      "Về rồi nhé. Tôi đợi thật đấy, không giấu nữa. Quà đây. Meo~",
      "Cậu về là tôi kêu grừ grừ ngay. Nghe thấy không?",
      "Nhà thiếu cậu là thiếu hẳn một khoảng nắng. Vào đi."
    ],
    night: [
      "Đêm nay tôi ngủ cạnh gối cậu nhé. …Đồng ý rồi đấy nhé. Meo~",
      "Ngủ ngon, người của tôi. À không, người nhà của tôi.",
      "Có tôi ở đây rồi. Mơ đẹp vào. Meo~"
    ],
    evolve: [
      "Tôi trưởng thành rồi. Cả chặng đường… đều có cậu. Cảm ơn.",
      "Lớn từng này là nhờ từng ngày cậu quay lại đấy. Meo~",
      "Giờ tôi đủ lớn để nói thẳng: ở cạnh cậu, tôi vui."
    ],
    idle: [
      "Tôi nằm chỗ này vì nhìn thấy cậu rõ nhất. Đấy, lý do đấy.",
      "Cậu làm việc đi. Thi thoảng tôi liếc qua thôi. Meo~",
      "Ở cạnh nhau im lặng thế này… cũng là một kiểu trò chuyện."
    ]
  }
};

const VOICE: Record<PetSpecies, VoicePack> = {
  dog: DOG_VOICE,
  cat: CAT_VOICE
};

function tierGroup(tier: BondTier): TierGroup {
  if (tier >= 4) return "high";
  if (tier === 3) return "mid";
  return "low";
}

/** Exposed for tests: the raw pool a given (species, tier, event) draws from. */
export function getVoicePool(species: PetSpecies, tier: BondTier, event: PetEvent): string[] {
  return VOICE[species][tierGroup(tier)][event];
}

// Shuffle bags per pool — every line plays once before any line repeats.
const bags = new Map<string, string[]>();

export function getPetLine(
  species: PetSpecies,
  tier: BondTier,
  event: PetEvent,
  random: () => number = Math.random
): string {
  const pool = getVoicePool(species, tier, event);
  const key = `${species}.${tierGroup(tier)}.${event}`;
  let bag = bags.get(key);

  if (!bag || bag.length === 0) {
    bag = shuffle(pool, random);
    bags.set(key, bag);
  }

  return bag.pop() ?? pool[0];
}

/** Exposed for tests: forget shuffle history. */
export function resetVoiceBags() {
  bags.clear();
}

function shuffle(items: string[], random: () => number): string[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}
