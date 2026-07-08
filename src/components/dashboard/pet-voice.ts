import type { BondTier, PetSpecies } from "@/components/dashboard/dashboard-data";

/**
 * Voice packs — the pet's personality lives here, Animal Crossing style:
 * one line table per species, gated by bond tier, rotated with a shuffle
 * bag so lines never repeat until the whole pool has been heard.
 *
 * Dog voice: devoted and loud — xưng "em", gọi "Sếp", barks "gâu".
 * Cat voice: tsundere — xưng "tôi", gọi "cậu", trails off in "meo~" and "…".
 * Golden rule: no line may ever guilt the user — and no social line may
 * ever compare anyone down (celebrate own garden, never rank a friend).
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
  | "idle"
  | "friendVisit"
  | "fairLantern"
  | "sharedRhythm";

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
    ],
    friendVisit: [
      "Sếp ơi, có bạn ghé thăm vườn mình đó! Em vẫy đuôi chào liền luôn, gâu!",
      "Hôm nay vườn mình có khách nè Sếp! Vui hẳn lên luôn á, gâu gâu!",
      "Bạn của Sếp ghé còn để lại quà nữa đó! Em canh kỹ lắm nha, gâu!"
    ],
    fairLantern: [
      "Sếp ơi, vườn mình được treo lồng đèn nè!! Đẹp lung linh ghê, gâu gâu!!",
      "Lồng đèn hội chợ kìa Sếp! Em chạy quanh ngắm ba vòng rồi đó, gâu!",
      "Em hãnh diện ghê! Vườn mình có lồng đèn nè Sếp, gâu!!"
    ],
    sharedRhythm: [
      "Sếp ơi, nhịp chung với bạn lớn thêm rồi nè! Cùng nhau vui ghê, gâu!",
      "Hôm nay cả Sếp và bạn đều chăm vườn đó! Em nhảy cẫng ăn mừng nè, gâu gâu!",
      "Nhịp chung thêm một ngày rồi! Có bạn đồng hành thích ghê, gâu!"
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
    ],
    friendVisit: [
      "Bạn thân ơi, có bạn ghé vườn nè! Em khoe mấy ô xanh của Sếp luôn đó, gâu!",
      "Khách quý tới thăm! Em dẫn đi xem vườn mình một vòng rồi nè, gâu gâu!",
      "Bạn Sếp gửi quà cho vườn mình nè! Em chưa đụng vô đâu nha, gâu!"
    ],
    fairLantern: [
      "Bạn thân ơi, mình có lồng đèn hội chợ nè!! Cả tuần chăm chỉ mà, gâu!",
      "Em ngồi dưới lồng đèn chờ Sếp ra ngắm chung nè, gâu gâu!",
      "Vườn mình rực rỡ ghê! Em muốn khoe với cả xóm luôn á, gâu!"
    ],
    sharedRhythm: [
      "Nhịp chung của Sếp với bạn lại dài thêm nè! Em gõ trống ăn mừng, gâu!",
      "Hai khu vườn cùng xanh một ngày nữa rồi đó Sếp! Vui ghê, gâu gâu!",
      "Cùng nhau giữ nhịp thế này, em thấy ấm cả vườn luôn á, gâu!"
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
    ],
    friendVisit: [
      "Nhà mình có khách nè Sếp! Em tiếp đón chu đáo lắm luôn đó, gâu!",
      "Bạn của Sếp khen vườn mình ấm ghê! Em nở mũi luôn nè, gâu gâu!",
      "Có quà bạn gửi nè Sếp! Người nhà mình được thương ghê đó, gâu~"
    ],
    fairLantern: [
      "Nhà mình có lồng đèn nè Sếp!! Mình ngắm chung một lát nha, gâu~",
      "Lồng đèn sáng cả vườn luôn! Công người nhà mình chăm đó, gâu!!",
      "Em cất kỷ niệm này lên kệ nhà mình nha Sếp! Đẹp quá trời, gâu!"
    ],
    sharedRhythm: [
      "Nhịp chung lớn thêm rồi! Người nhà mình với bạn cùng nhau giỏi ghê, gâu!",
      "Sếp với bạn cùng chăm thêm một ngày nữa! Em tự hào về cả hai luôn, gâu gâu!",
      "Nhịp này ấm như ổ nằm của em vậy đó Sếp. Mình cùng nhau tiếp nha, gâu~"
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
    ],
    friendVisit: [
      "Có người ghé vườn đấy. Tôi có ra chào. Một cái gật đầu. Meo.",
      "Khách của cậu tới lúc nãy. Tôi… có cho ngồi ghế đấy.",
      "Có quà ai để lại kìa. Tôi trông giúp thôi, đừng hiểu lầm. Meo."
    ],
    fairLantern: [
      "Vườn có lồng đèn kìa. Tôi không ngắm đâu. …Ngắm một chút. Meo.",
      "Hm. Lồng đèn à. Treo ở vườn này thì… cũng hợp đấy.",
      "Đèn sáng thế ai ngủ được. …Thôi được, đẹp thật. Meo."
    ],
    sharedRhythm: [
      "Nhịp chung với bạn cậu tăng rồi đấy. Tôi chỉ báo tin thôi. Meo.",
      "Hai người cùng chăm vườn hôm nay à. …Cũng dễ thương phết.",
      "Nhịp chung thêm một ngày. Tôi có liếc nhìn. Một lần thôi. Meo."
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
    ],
    friendVisit: [
      "Bạn cậu ghé vườn đấy. Tôi có tiếp chuyện… theo kiểu của mèo. Meo.",
      "Có khách tới thăm. Vườn hôm nay… đông vui phết. Nói nhỏ thôi.",
      "Bạn cậu gửi quà này. Tôi giữ nguyên chưa đụng. Khen tôi đi. Meo~"
    ],
    fairLantern: [
      "Lồng đèn hội chợ đấy. Vườn mình tuần này… ra dáng phết. Meo~",
      "Tôi nằm dưới lồng đèn cả chiều. Vì chỗ đó ấm thôi. Ừ. Vì ấm.",
      "Cậu thấy lồng đèn chưa. Công cậu chăm vườn đấy. Tôi chỉ nói một lần."
    ],
    sharedRhythm: [
      "Nhịp chung lại lớn thêm đấy. Cùng nhau thế này… không tệ. Meo~",
      "Cậu và bạn giữ nhịp đều ghê. Tôi kể cho con bướm nghe rồi đấy.",
      "Thêm một ngày cùng nhau rồi. Tôi… có hơi vui. Có hơi thôi. Meo."
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
    ],
    friendVisit: [
      "Bạn cậu ghé chơi đấy. Nhà mình có khách cũng… ấm ra phết. Meo~",
      "Có người tới thăm vườn. Tôi khoe cậu với người ta rồi. Ừ, tôi khoe đấy.",
      "Quà của bạn cậu đây. Nhà mình được quý thật đấy. Meo~"
    ],
    fairLantern: [
      "Lồng đèn nhà mình đẹp nhỉ. Ừ, tôi nói 'nhà mình' đấy. Meo~",
      "Tuần này vườn mình sáng ghê. Tôi tự hào về cậu. …Đó, nói rồi đó.",
      "Ngồi ngắm lồng đèn cùng tôi một lát đi. Chỉ một lát thôi. Meo~"
    ],
    sharedRhythm: [
      "Nhịp chung của cậu và bạn ấm thật đấy. Tôi thích nhìn nó lớn lên. Meo~",
      "Cùng nhau từng ngày thế này… nhà mình vui hẳn ra. Ừ, tôi nói thật đấy.",
      "Nhịp lại thêm một ngày. Tôi grừ grừ vì mừng đấy, không giấu nữa. Meo~"
    ]
  }
};

const VOICE: Record<PetSpecies, VoicePack> = {
  dog: DOG_VOICE,
  cat: CAT_VOICE
};

/**
 * Guest-side voice — the host's pet greeting a *visiting friend*.
 * Keyed by species only: a visitor has no bond with the host's pet.
 */
export type GuestEvent = "guestPet" | "guestGift";

type GuestVoicePack = Record<GuestEvent, string[]>;

const GUEST_VOICE: Record<PetSpecies, GuestVoicePack> = {
  dog: {
    guestPet: [
      "Oa!! Bạn của Sếp xoa đầu em nè! Đuôi em vẫy tít mù luôn, gâu gâu!!",
      "Hehe, tay bạn ấm ghê! Em lăn ra sân cho xoa bụng luôn nè, gâu!",
      "Khách quý cưng em kìa!! Em vui muốn xỉu luôn á, gâu gâu!!"
    ],
    guestGift: [
      "Bạn cho em ăn hả?! Cảm ơn bạn nhiều lắm luôn, gâu gâu!!",
      "Món này ngon ghê!! Em sẽ khoe Sếp là bạn dễ thương nhất, gâu!",
      "Khách tới còn mang đồ ăn ngon! Vườn nhà em hên ghê, gâu!!"
    ]
  },
  cat: {
    guestPet: [
      "Khách à. Cho chạm ba giây thôi đấy. …Thêm hai giây nữa cũng được. Meo.",
      "Tôi không quen người lạ đâu. …Grừ grừ. Tiếng đó tự phát thôi. Meo~",
      "Hm. Tay khách ấm phết. Đừng kể với ai là tôi có nheo mắt đấy."
    ],
    guestGift: [
      "Cho tôi à? Đặt xuống đó đi. …Cảm ơn. Nói nhỏ thôi. Meo.",
      "Khách biết chọn món ghê. Tôi nhận vì lịch sự… Ngon thật đấy. Meo~",
      "Quà này tôi để khoe người nhà trước rồi mới ăn. Ừ, tôi khoe đấy."
    ]
  }
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

/** Exposed for tests: the raw guest-side pool for a given (species, event). */
export function getGuestVoicePool(species: PetSpecies, event: GuestEvent): string[] {
  return GUEST_VOICE[species][event];
}

// Shuffle bags per pool — every line plays once before any line repeats.
const bags = new Map<string, string[]>();

function drawFromBag(key: string, pool: string[], random: () => number): string {
  let bag = bags.get(key);

  if (!bag || bag.length === 0) {
    bag = shuffle(pool, random);
    bags.set(key, bag);
  }

  return bag.pop() ?? pool[0];
}

export function getPetLine(
  species: PetSpecies,
  tier: BondTier,
  event: PetEvent,
  random: () => number = Math.random
): string {
  const pool = getVoicePool(species, tier, event);

  return drawFromBag(`${species}.${tierGroup(tier)}.${event}`, pool, random);
}

/** What the host's pet says to a visiting friend (thăm vườn overlay). */
export function getGuestLine(
  species: PetSpecies,
  event: GuestEvent,
  random: () => number = Math.random
): string {
  const pool = getGuestVoicePool(species, event);

  return drawFromBag(`guest.${species}.${event}`, pool, random);
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
