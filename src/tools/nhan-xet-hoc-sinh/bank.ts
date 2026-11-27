/**
 * Kho câu nhận xét tự soạn, theo ba mức của Thông tư 27/2020 (Thông tư 89/2026 không đổi
 * tên các mức). Câu không so sánh em này với bạn khác.
 *
 * `{X}` là cách xưng hô viết hoa đầu câu, `{x}` dùng giữa câu, `{môn}` là tên môn.
 */

export type Study = 'tot' | 'dat' | 'chua';
export type Quality = 'tot' | 'dat' | 'cg';
export type Focus = 'chung' | 'toan' | 'tieng-viet' | 'tieng-anh' | 'khac';

/** Câu mở đầu: thái độ và phẩm chất. */
export const OPENINGS: Record<Quality, string[]> = {
  tot: [
    '{X} chăm ngoan, lễ phép và có tinh thần trách nhiệm.',
    '{X} tự giác trong học tập, biết quan tâm và giúp đỡ mọi người.',
    '{X} đi học chuyên cần, trung thực và tích cực tham gia hoạt động của lớp.',
    '{X} lễ phép với thầy cô, đoàn kết với bạn bè và giữ nền nếp tốt.',
    '{X} có ý thức tự quản, luôn hoàn thành việc được giao.',
    '{X} vui vẻ, hoà đồng và sẵn sàng nhận nhiệm vụ chung.',
  ],
  dat: [
    '{X} ngoan, biết vâng lời thầy cô và hoà đồng với bạn bè.',
    '{X} đi học đều và thực hiện được nền nếp của lớp.',
    '{X} lễ phép, có tham gia các hoạt động chung của lớp.',
    '{X} biết giữ gìn đồ dùng và làm được việc được giao.',
    '{X} thân thiện với bạn bè, thực hiện được nội quy trường lớp.',
  ],
  cg: [
    '{X} ngoan nhưng cần chú ý hơn đến nền nếp học tập.',
    '{X} cần mạnh dạn và tự giác hơn khi tham gia hoạt động của lớp.',
    '{X} cần cố gắng chuẩn bị đầy đủ đồ dùng và bài trước khi đến lớp.',
    '{X} cần tập trung hơn trong giờ học và thực hiện tốt nội quy.',
    '{X} cần rèn thói quen tự hoàn thành việc của mình đúng hạn.',
  ],
};

/** Câu thân: kết quả học tập theo trọng tâm. */
export const BODIES: Record<Focus, Record<Study, string[]>> = {
  chung: {
    tot: [
      '{X} tiếp thu bài nhanh, nắm chắc kiến thức và vận dụng tốt vào bài tập.',
      '{X} hoàn thành tốt các nội dung học tập, trình bày bài sạch sẽ, rõ ràng.',
      '{X} chủ động phát biểu, tự học tốt và biết hợp tác khi làm việc nhóm.',
      'Kết quả học tập của {x} rất tốt, {x} diễn đạt ý tự tin và mạch lạc.',
    ],
    dat: [
      '{X} nắm được kiến thức cơ bản và hoàn thành các bài tập theo yêu cầu.',
      '{X} hoàn thành nội dung các môn học, có tiến bộ trong cách trình bày bài.',
      '{X} làm được các bài cơ bản, đôi lúc còn cần thầy cô gợi ý.',
      'Kết quả học tập của {x} đạt yêu cầu, {x} đã chú ý nghe giảng hơn.',
    ],
    chua: [
      '{X} còn lúng túng với một số kiến thức cơ bản và cần được hướng dẫn thêm.',
      '{X} chưa hoàn thành một số yêu cầu học tập, nhất là các bài cần tự làm.',
      '{X} tiếp thu bài còn chậm, cần được ôn lại thường xuyên.',
      'Một số nội dung học tập {x} chưa nắm vững, cần có thêm thời gian luyện tập.',
    ],
  },
  toan: {
    tot: [
      '{X} tính toán nhanh, chính xác và giải toán có lời văn tốt.',
      '{X} nắm chắc các phép tính, biết chọn cách làm hợp lí.',
      '{X} học tốt môn Toán, trình bày bài giải rõ ràng, đủ bước.',
      '{X} vận dụng kiến thức Toán linh hoạt, thích tìm cách giải mới.',
    ],
    dat: [
      '{X} thực hiện được các phép tính cơ bản, đôi khi còn nhầm khi tính.',
      '{X} làm được bài toán quen thuộc, cần đọc kĩ đề hơn khi giải toán có lời văn.',
      '{X} hoàn thành yêu cầu môn Toán, nên kiểm tra lại bài trước khi nộp.',
      '{X} nắm được cách đặt tính và tính, tốc độ làm bài đã khá hơn.',
    ],
    chua: [
      '{X} còn nhầm lẫn khi thực hiện phép tính và cần ôn lại bảng cộng, trừ, nhân, chia.',
      '{X} chưa giải được bài toán có lời văn khi không có gợi ý.',
      '{X} tính còn chậm, cần luyện thêm các phép tính cơ bản.',
      '{X} chưa nắm vững cách đặt tính, cần được kèm thêm môn Toán.',
    ],
  },
  'tieng-viet': {
    tot: [
      '{X} đọc to, rõ, diễn cảm và hiểu tốt nội dung bài.',
      '{X} viết chữ đúng mẫu, ít sai chính tả và đặt câu hay.',
      '{X} học tốt môn Tiếng Việt, vốn từ phong phú, diễn đạt mạch lạc.',
      '{X} viết đoạn văn đủ ý, câu văn rõ ràng và có cảm xúc.',
    ],
    dat: [
      '{X} đọc đúng bài, cần đọc to và ngắt nghỉ đúng chỗ hơn.',
      '{X} viết được bài theo yêu cầu, còn mắc một vài lỗi chính tả.',
      '{X} hiểu được nội dung chính của bài đọc, nên viết câu đầy đủ hơn.',
      '{X} hoàn thành yêu cầu môn Tiếng Việt, chữ viết đã tiến bộ.',
    ],
    chua: [
      '{X} đọc còn chậm, đôi lúc phải đánh vần và cần luyện đọc mỗi ngày.',
      '{X} còn sai nhiều lỗi chính tả, cần luyện viết thêm.',
      '{X} chưa viết được câu đầy đủ ý khi không có gợi ý.',
      '{X} hiểu bài đọc còn hạn chế, cần được đọc cùng và hỏi lại nội dung.',
    ],
  },
  'tieng-anh': {
    tot: [
      '{X} phát âm rõ, nhớ từ vựng tốt và mạnh dạn nói tiếng Anh.',
      '{X} nghe hiểu và trả lời câu hỏi tiếng Anh tốt.',
      '{X} học tốt môn Tiếng Anh, đọc và viết được các mẫu câu đã học.',
      '{X} tích cực giao tiếp bằng tiếng Anh trong giờ học.',
    ],
    dat: [
      '{X} nhớ được từ và mẫu câu cơ bản, cần mạnh dạn nói hơn.',
      '{X} nghe và làm theo được yêu cầu đơn giản bằng tiếng Anh.',
      '{X} hoàn thành yêu cầu môn Tiếng Anh, cần chú ý phát âm âm cuối.',
      '{X} đọc được câu ngắn, viết từ đôi lúc còn thiếu chữ cái.',
    ],
    chua: [
      '{X} còn quên nhiều từ vựng, cần ôn lại thường xuyên.',
      '{X} ngại nói tiếng Anh, cần được khuyến khích và luyện nghe thêm.',
      '{X} chưa đọc được các mẫu câu đã học khi không có hỗ trợ.',
      '{X} cần luyện thêm cách đọc và viết các từ quen thuộc.',
    ],
  },
  khac: {
    tot: [
      '{X} học tốt môn {môn}, tiếp thu nhanh và thực hành thành thạo.',
      '{X} nắm chắc nội dung môn {môn}, biết liên hệ với thực tế.',
      '{X} tích cực, sáng tạo trong các hoạt động của môn {môn}.',
    ],
    dat: [
      '{X} hoàn thành yêu cầu môn {môn}, thực hành được những nội dung cơ bản.',
      '{X} nắm được nội dung chính của môn {môn}, nên tham gia phát biểu nhiều hơn.',
      '{X} làm được bài thực hành môn {môn} khi được hướng dẫn.',
    ],
    chua: [
      '{X} chưa nắm vững một số nội dung môn {môn}.',
      '{X} còn lúng túng khi thực hành môn {môn}, cần được hướng dẫn thêm.',
      '{X} chưa hoàn thành một số yêu cầu của môn {môn}.',
    ],
  },
};

/** Câu khuyên: dùng chung cho mọi trọng tâm. */
export const ADVICE: Record<Study, string[]> = {
  tot: [
    '{X} hãy tiếp tục phát huy nhé!',
    'Mong {x} giữ vững kết quả và chia sẻ cách học với các bạn.',
    '{X} nên đọc thêm sách để mở rộng hiểu biết.',
    'Thầy cô tin {x} sẽ còn tiến bộ hơn nữa.',
    '{X} hãy mạnh dạn thử sức với những bài khó hơn.',
    'Mong {x} luôn giữ niềm yêu thích học tập.',
  ],
  dat: [
    '{X} cố gắng luyện tập thêm để làm bài chắc chắn hơn nhé!',
    '{X} nên mạnh dạn hỏi khi chưa hiểu bài.',
    'Mong {x} dành thêm thời gian ôn bài ở nhà.',
    '{X} chú ý làm bài cẩn thận và soát lại trước khi nộp.',
    'Thầy cô tin {x} sẽ tiến bộ nếu kiên trì luyện tập.',
    '{X} hãy tích cực phát biểu hơn trong giờ học.',
  ],
  chua: [
    '{X} cần ôn bài mỗi ngày, thầy cô và gia đình sẽ cùng giúp {x}.',
    'Gia đình phối hợp cùng {x} luyện tập thêm ở nhà.',
    '{X} đừng ngại hỏi, hãy tập từng bài nhỏ cho thật chắc.',
    'Mong {x} chăm chỉ hơn, mỗi ngày tiến bộ một chút.',
    '{X} cần chú ý nghe giảng và hoàn thành bài tại lớp.',
  ],
};
