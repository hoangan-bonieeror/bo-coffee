import { Injectable, computed, inject } from '@angular/core';
import { I18nText } from './models';
import { StoreService } from './store.service';

/** UI strings. Post content carries its own language versions. */
const DICT = {
  'app.name': { vi: 'Bo Coffee', en: 'Bo Coffee' },
  'app.tagline': { vi: 'Sổ tay cà phê', en: 'Coffee notebook' },

  'nav.home': { vi: 'Thực đơn', en: 'Menu' },
  'nav.posts': { vi: 'Bài viết', en: 'Posts' },
  'nav.more': { vi: 'Thêm', en: 'More' },
  'nav.categories': { vi: 'Chuyên mục', en: 'Topics' },
  'nav.series': { vi: 'Series', en: 'Series' },
  'nav.tools': { vi: 'Pha', en: 'Brew' },
  'nav.journal': { vi: 'Nhật ký', en: 'Journal' },
  'nav.beans': { vi: 'Kệ hạt', en: 'Bean shelf' },
  'nav.glossary': { vi: 'Thuật ngữ', en: 'Glossary' },
  'nav.news': { vi: 'Bản tin cà phê', en: 'Coffee news' },
  'nav.archive': { vi: 'Lưu trữ', en: 'Archive' },
  'nav.search': { vi: 'Tìm kiếm', en: 'Search' },
  'nav.saved': { vi: 'Đã lưu', en: 'Saved' },
  'nav.menu': { vi: 'Menu', en: 'Menu' },
  'nav.toggleTheme': { vi: 'Đổi giao diện sáng/tối', en: 'Toggle light/dark' },

  'common.loading': { vi: 'Đang tải…', en: 'Loading…' },
  'common.error': { vi: 'Không tải được nội dung.', en: 'Could not load content.' },
  'common.notFound': { vi: 'Không tìm thấy bài viết này.', en: 'This post could not be found.' },
  'common.minRead': { vi: 'phút đọc', en: 'min read' },
  'common.posts': { vi: 'bài', en: 'posts' },
  'common.backHome': { vi: 'Về trang chủ', en: 'Back to home' },
  'common.save': { vi: 'Lưu', en: 'Save' },
  'common.cancel': { vi: 'Hủy', en: 'Cancel' },
  'common.edit': { vi: 'Sửa', en: 'Edit' },
  'common.delete': { vi: 'Xóa', en: 'Delete' },

  'unit.hours': { vi: 'giờ', en: 'hours' },
  'unit.minutes': { vi: 'phút', en: 'min' },
  'unit.seconds': { vi: 'giây', en: 's' },

  'type.article': { vi: 'Bài viết', en: 'Article' },
  'type.note': { vi: 'Ghi chép', en: 'Note' },
  'type.guide': { vi: 'Hướng dẫn pha', en: 'Brew guide' },
  'type.news': { vi: 'Bản tin', en: 'News' },

  'level.beginner': { vi: 'Nhập môn', en: 'Beginner' },
  'level.intermediate': { vi: 'Trung cấp', en: 'Intermediate' },
  'level.advanced': { vi: 'Nâng cao', en: 'Advanced' },

  'home.menuTitle': { vi: 'Thực đơn cách pha', en: 'Brew menu' },
  'home.menuNote': {
    vi: 'Giá trên bảng là tỉ lệ cà phê : nước. Chọn một món, Bo Coffee tính sẵn và bấm giờ từng bước.',
    en: 'The price on the board is the coffee : water ratio. Pick one and Bo Coffee does the maths and times every step.',
  },
  'home.lastCup': { vi: 'Ly gần nhất', en: 'Last cup' },
  'home.balanced': { vi: 'Cân bằng', en: 'Balanced' },
  'home.under': { vi: 'Chiết thiếu', en: 'Under-extracted' },
  'home.over': { vi: 'Chiết quá', en: 'Over-extracted' },
  'home.cupEmpty': {
    vi: 'Chưa có ly nào đo TDS. Đo bằng khúc xạ kế rồi ghi vào nhật ký để thấy ly của bạn nằm ở đâu so với vùng chiết xuất lý tưởng.',
    en: 'No cup with a TDS reading yet. Measure with a refractometer and log it to see where your cup lands against the ideal extraction zone.',
  },
  'home.cupLog': { vi: 'Ghi một lần pha', en: 'Log a brew' },
  'home.ey': { vi: 'Chiết xuất', en: 'Extraction' },
  'home.rating': { vi: 'Điểm', en: 'Rating' },
  'home.eyAxis': { vi: 'Chiết xuất %', en: 'Extraction %' },
  'home.idealZone': { vi: 'Vùng lý tưởng', en: 'Ideal zone' },
  'home.chartAlt': {
    vi: 'Biểu đồ các lần pha gần đây theo tỉ lệ chiết xuất và TDS',
    en: 'Chart of recent brews by extraction yield and TDS',
  },
  'home.allPosts': { vi: 'Tất cả bài viết', en: 'All posts' },
  'home.tools': { vi: 'Công cụ', en: 'Tools' },
  'home.toolRatio': { vi: 'Máy tính tỉ lệ', en: 'Ratio calculator' },
  'home.toolTimer': { vi: 'Hẹn giờ pha', en: 'Brew timer' },
  'home.toolEy': { vi: 'Tính chiết xuất', en: 'Extraction calculator' },
  'home.toolWheel': { vi: 'Bánh xe hương vị', en: 'Flavor wheel' },
  'post.params': { vi: 'Thông số pha', en: 'Brew recipe' },
  'post.pCoffee': { vi: 'Cà phê', en: 'Coffee' },
  'post.pWater': { vi: 'Nước', en: 'Water' },
  'post.pRatio': { vi: 'Tỉ lệ', en: 'Ratio' },
  'post.pTemp': { vi: 'Nhiệt độ', en: 'Temperature' },
  'post.pGrind': { vi: 'Độ xay', en: 'Grind' },
  'post.pTime': { vi: 'Thời gian', en: 'Time' },
  'post.brewThis': { vi: 'Mở hẹn giờ', en: 'Open the timer' },
  'home.title': {
    vi: 'Hiểu ly cà phê bạn uống mỗi ngày',
    en: 'Understand the coffee you drink every day',
  },
  'home.subtitle': {
    vi: 'Từ hạt, sơ chế, rang đến pha và nếm — kèm công cụ tính tỉ lệ, hẹn giờ pha và nhật ký riêng của bạn.',
    en: 'From bean, processing and roasting to brewing and tasting — with a ratio calculator, a brew timer and your own journal.',
  },
  'home.start': { vi: 'Bắt đầu từ con số 0', en: 'Start from zero' },
  'home.brewNow': { vi: 'Pha ngay', en: 'Brew now' },
  'home.methods': { vi: 'cách pha', en: 'brew methods' },
  'home.methodsTitle': { vi: 'Cách pha', en: 'Brew methods' },
  'home.featured': { vi: 'Nổi bật', en: 'Featured' },
  'home.latest': { vi: 'Bài mới nhất', en: 'Latest posts' },
  'home.loadMore': { vi: 'Xem thêm bài', en: 'Load more' },
  'home.categories': { vi: 'Chuyên mục', en: 'Topics' },
  'home.series': { vi: 'Series', en: 'Series' },
  'home.tags': { vi: 'Thẻ phổ biến', en: 'Popular tags' },
  'home.news': { vi: 'Bản tin tuần này', en: "This week's news" },
  'home.allNews': { vi: 'Các bản tin trước', en: 'Earlier digests' },
  'home.journal': { vi: 'Nhật ký của bạn', en: 'Your journal' },
  'home.journalEmpty': {
    vi: 'Chưa có lần pha nào. Dùng hẹn giờ rồi bấm “Lưu vào nhật ký”.',
    en: 'No brews yet. Use the timer, then tap “Save to journal”.',
  },
  'news.about': {
    vi: 'Mỗi sáng thứ Hai, bot đọc các trang tin cà phê lớn, chọn tin đáng chú ý và dùng Gemini tóm tắt song ngữ. Bấm vào tiêu đề để đọc bài gốc.',
    en: 'Every Monday morning a bot reads major coffee news sites, picks what matters and summarises it in both languages with Gemini. Follow a title to read the original.',
  },

  'post.toc': { vi: 'Mục lục', en: 'On this page' },
  'post.backTop': { vi: 'Lên đầu trang', en: 'Back to top' },
  'post.fallback': {
    vi: 'Bài này chưa có bản tiếng Việt, đang hiển thị bản tiếng Anh.',
    en: 'No English version yet — showing Vietnamese.',
  },
  'post.bookmark': { vi: 'Lưu để đọc sau', en: 'Save for later' },
  'post.bookmarked': { vi: 'Đã lưu', en: 'Saved' },
  'post.read': { vi: 'Đã đọc', en: 'Read' },
  'post.inSeries': { vi: 'Thuộc series', en: 'Part of the series' },
  'post.part': { vi: 'Phần', en: 'Part' },
  'post.prev': { vi: 'Bài trước', en: 'Previous' },
  'post.next': { vi: 'Bài tiếp', en: 'Next' },
  'post.related': { vi: 'Bài liên quan', en: 'Related posts' },
  'post.notes': { vi: 'Ghi chú của bạn', en: 'Your notes' },
  'post.notesHint': {
    vi: 'Ghi lại điều bạn rút ra, lần pha thử… Ghi chú chỉ lưu trong trình duyệt này.',
    en: 'Write down takeaways or test brews… Notes are stored only in this browser.',
  },
  'post.notesSaved': { vi: 'Đã lưu', en: 'Saved' },

  'series.subtitle': {
    vi: 'Các chuỗi bài nên đọc theo thứ tự.',
    en: 'Multi-part posts best read in order.',
  },
  'series.parts': { vi: 'phần', en: 'parts' },
  'series.start': { vi: 'Bắt đầu đọc', en: 'Start reading' },

  'archive.title': { vi: 'Lưu trữ', en: 'Archive' },
  'archive.subtitle': { vi: 'Tất cả bài viết theo thời gian.', en: 'Every post, by date.' },
  'tag.title': { vi: 'Thẻ', en: 'Tag' },
  'category.empty': {
    vi: 'Chuyên mục này chưa có bài. Quay lại sau nhé.',
    en: 'No posts in this topic yet. Check back soon.',
  },

  'search.placeholder': {
    vi: 'Tìm bài viết: phin, Robusta, natural…',
    en: 'Search posts: phin, Robusta, natural…',
  },
  'search.results': { vi: 'kết quả', en: 'results' },
  'search.none': {
    vi: 'Không có kết quả. Thử từ khóa khác?',
    en: 'Nothing found. Try another keyword?',
  },
  'search.hint': { vi: 'Gõ ít nhất 2 ký tự để tìm.', en: 'Type at least 2 characters.' },

  'saved.title': { vi: 'Đã lưu', en: 'Saved' },
  'saved.subtitle': {
    vi: 'Bài đánh dấu đọc sau và ghi chú của bạn.',
    en: 'Your bookmarks and notes.',
  },
  'saved.bookmarks': { vi: 'Đọc sau', en: 'Read later' },
  'saved.notes': { vi: 'Ghi chú', en: 'Notes' },
  'saved.history': { vi: 'Đã đọc gần đây', en: 'Recently read' },
  'saved.emptyBookmarks': {
    vi: 'Chưa lưu bài nào. Bấm 🔖 trên một bài viết để lưu.',
    en: 'Nothing saved yet. Tap 🔖 on a post to save it.',
  },
  'saved.emptyNotes': {
    vi: 'Chưa có ghi chú. Ghi chú nằm ở cuối mỗi bài viết.',
    en: 'No notes yet. You can write one at the end of any post.',
  },
  'saved.data': { vi: 'Sao lưu dữ liệu đọc', en: 'Reading backup' },
  'saved.dataNote': {
    vi: 'Bookmark, ghi chú và lịch sử đọc chỉ lưu trong trình duyệt này. Nhật ký pha có nút sao lưu riêng ở trang Nhật ký.',
    en: 'Bookmarks, notes and history live only in this browser. The brew journal has its own backup on the Journal page.',
  },
  'saved.export': { vi: 'Xuất file', en: 'Export' },
  'saved.import': { vi: 'Nhập file', en: 'Import' },
  'saved.reset': { vi: 'Xóa tất cả', en: 'Clear all' },
  'saved.resetConfirm': {
    vi: 'Xóa toàn bộ bookmark, ghi chú và lịch sử đọc?',
    en: 'Delete all bookmarks, notes and history?',
  },
  'saved.imported': { vi: 'Đã nhập dữ liệu.', en: 'Backup imported.' },
  'saved.importFailed': { vi: 'File không hợp lệ.', en: 'Invalid backup file.' },

  'calc.title': { vi: 'Tính tỉ lệ', en: 'Ratio calculator' },
  'calc.coffee': { vi: 'Cà phê', en: 'Coffee' },
  'calc.water': { vi: 'Nước', en: 'Water' },
  'calc.yield': { vi: 'Lượng ra cốc', en: 'Yield' },
  'calc.ratio': { vi: 'Tỉ lệ', en: 'Ratio' },
  'calc.stronger': { vi: 'Đậm', en: 'Stronger' },
  'calc.lighter': { vi: 'Nhạt', en: 'Lighter' },
  'calc.temp': { vi: 'Nhiệt độ nước', en: 'Water temp' },
  'calc.grind': { vi: 'Độ xay', en: 'Grind' },
  'calc.time': { vi: 'Thời gian', en: 'Time' },
  'calc.openTimer': { vi: 'Mở hẹn giờ với công thức này', en: 'Open the timer with this recipe' },
  'calc.source': { vi: 'Nguồn số liệu', en: 'Sources' },

  'timer.title': { vi: 'Hẹn giờ pha', en: 'Brew timer' },
  'timer.out': { vi: 'ra cốc', en: 'out' },
  'timer.focus': { vi: 'Chế độ toàn màn hình', en: 'Focus mode' },
  'timer.ready': {
    vi: 'Sẵn sàng. Bấm Bắt đầu khi rót giọt đầu tiên.',
    en: 'Ready. Press Start with your first pour.',
  },
  'timer.pourTo': { vi: 'Rót đến', en: 'Pour to' },
  'timer.next': { vi: 'Tiếp theo sau', en: 'Next in' },
  'timer.start': { vi: 'Bắt đầu', en: 'Start' },
  'timer.resume': { vi: 'Tiếp tục', en: 'Resume' },
  'timer.pause': { vi: 'Tạm dừng', en: 'Pause' },
  'timer.reset': { vi: 'Làm lại', en: 'Reset' },
  'timer.log': { vi: 'Lưu vào nhật ký', en: 'Save to journal' },

  'flavor.title': { vi: 'Vòng hương vị', en: 'Flavor wheel' },
  'flavor.hint': {
    vi: 'Bấm vào một nhóm để xem mô tả. Vòng ngoài là các nốt hương cụ thể.',
    en: 'Tap a family to read about it. The outer ring holds specific notes.',
  },

  'tools.title': { vi: 'Công cụ pha', en: 'Brew tools' },
  'tools.subtitle': {
    vi: 'Chọn cách pha, chỉnh tỉ lệ, rồi bấm giờ theo từng bước. Xong thì lưu vào nhật ký.',
    en: 'Pick a method, set the ratio, then follow the timed steps. Save the result to your journal.',
  },
  'tools.method': { vi: 'Cách pha', en: 'Brew method' },

  'ey.title': { vi: 'Tính độ chiết xuất', en: 'Extraction calculator' },
  'ey.intro': {
    vi: 'Nếu có khúc xạ kế đo TDS, nhập vào đây để biết ly cà phê chiết xuất thiếu, đủ hay quá.',
    en: 'If you have a refractometer, enter your TDS to see whether the cup is under-, well- or over-extracted.',
  },
  'ey.tds': { vi: 'TDS', en: 'TDS' },
  'ey.beverage': { vi: 'Khối lượng nước cà phê', en: 'Beverage weight' },
  'ey.under': {
    vi: 'Chiết xuất thiếu: dễ chua, mỏng. Xay mịn hơn hoặc pha lâu hơn.',
    en: 'Under-extracted: likely sour and thin. Grind finer or brew longer.',
  },
  'ey.over': {
    vi: 'Chiết xuất quá: dễ đắng, chát. Xay thô hơn hoặc rút ngắn thời gian.',
    en: 'Over-extracted: likely bitter and drying. Grind coarser or shorten the brew.',
  },
  'ey.weak': {
    vi: 'Chiết xuất tốt nhưng loãng: tăng lượng cà phê.',
    en: 'Well extracted but weak: use more coffee.',
  },
  'ey.strong': {
    vi: 'Chiết xuất tốt nhưng đặc: thêm nước.',
    en: 'Well extracted but strong: add water.',
  },
  'ey.balanced': {
    vi: 'Cân bằng, nằm trong vùng Gold Cup.',
    en: 'Balanced, inside the Gold Cup zone.',
  },
  'ey.zone': {
    vi: 'Vùng xanh: chiết xuất 18–22%, TDS 1,15–1,35% (chuẩn Gold Cup cho cà phê lọc; espresso đo theo chuẩn khác)',
    en: 'Green zone: 18–22% extraction, 1.15–1.35% TDS (Gold Cup standard for filter coffee; espresso uses a different range)',
  },

  'beans.title': { vi: 'Kệ hạt', en: 'Bean shelf' },
  'beans.subtitle': {
    vi: 'Các túi cà phê bạn đang có: nguồn gốc, ngày rang và lượng còn lại.',
    en: 'The bags you have: origin, roast date and how much is left.',
  },
  'beans.add': { vi: 'Thêm túi hạt', en: 'Add a bag' },
  'beans.edit': { vi: 'Sửa túi hạt', en: 'Edit bag' },
  'beans.name': { vi: 'Tên', en: 'Name' },
  'beans.namePh': {
    vi: 'vd. Cầu Đất Arabica, Ethiopia Guji…',
    en: 'e.g. Ethiopia Guji, Colombia Huila…',
  },
  'beans.roaster': { vi: 'Nhà rang', en: 'Roaster' },
  'beans.origin': { vi: 'Mã nước', en: 'Country code' },
  'beans.species': { vi: 'Loài', en: 'Species' },
  'beans.process': { vi: 'Sơ chế', en: 'Process' },
  'beans.roast': { vi: 'Mức rang', en: 'Roast' },
  'beans.roastDate': { vi: 'Ngày rang', en: 'Roast date' },
  'beans.bag': { vi: 'Khối lượng túi', en: 'Bag size' },
  'beans.notes': { vi: 'Nốt hương trên bao bì', en: 'Tasting notes on the bag' },
  'beans.notesPh': { vi: 'cách nhau bằng dấu phẩy', en: 'comma separated' },
  'beans.day': { vi: 'Ngày thứ', en: 'Day' },
  'beans.afterRoast': { vi: 'sau rang', en: 'after roast' },
  'beans.resting': {
    vi: 'nên đợi thêm vài ngày cho hạt “nghỉ”',
    en: 'let it rest a few more days',
  },
  'beans.left': { vi: 'còn lại', en: 'left' },
  'beans.brews': { vi: 'lần pha', en: 'brews' },
  'beans.brewThis': { vi: 'Pha túi này', en: 'Brew this' },
  'beans.archive': { vi: 'Hết túi', en: 'Finished' },
  'beans.unarchive': { vi: 'Dùng lại', en: 'Restore' },
  'beans.archived': { vi: 'đã hết', en: 'finished' },
  'beans.empty': {
    vi: 'Kệ còn trống. Thêm túi cà phê đầu tiên của bạn.',
    en: 'The shelf is empty. Add your first bag.',
  },
  'beans.deleteConfirm': {
    vi: 'Xóa túi hạt này? Các lần pha đã ghi vẫn được giữ.',
    en: 'Delete this bag? Logged brews are kept.',
  },

  'species.arabica': { vi: 'Arabica', en: 'Arabica' },
  'species.robusta': { vi: 'Robusta', en: 'Robusta' },
  'species.liberica': { vi: 'Liberica (Mít)', en: 'Liberica' },
  'species.blend': { vi: 'Phối trộn', en: 'Blend' },
  'process.washed': { vi: 'Ướt (washed)', en: 'Washed' },
  'process.natural': { vi: 'Khô (natural)', en: 'Natural' },
  'process.honey': { vi: 'Mật ong (honey)', en: 'Honey' },
  'process.anaerobic': { vi: 'Lên men yếm khí', en: 'Anaerobic' },
  'process.other': { vi: 'Khác', en: 'Other' },
  'roast.light': { vi: 'Rang sáng', en: 'Light' },
  'roast.medium': { vi: 'Rang vừa', en: 'Medium' },
  'roast.dark': { vi: 'Rang đậm', en: 'Dark' },

  'brew.title': { vi: 'Nhật ký pha', en: 'Brew journal' },
  'brew.subtitle': {
    vi: 'Mỗi lần pha: công thức, điểm và nốt hương. Dữ liệu chỉ nằm trong trình duyệt của bạn.',
    en: 'Every brew: recipe, rating and flavor notes. Your data stays in this browser.',
  },
  'brew.new': { vi: 'Ghi lần pha', en: 'Log a brew' },
  'brew.edit': { vi: 'Sửa lần pha', en: 'Edit brew' },
  'brew.when': { vi: 'Thời điểm', en: 'When' },
  'brew.temp': { vi: 'Nhiệt độ nước', en: 'Water temp' },
  'brew.grindPh': { vi: 'vd. 18 click, “mịn vừa”', en: 'e.g. 18 clicks, “medium-fine”' },
  'brew.optional': { vi: 'tùy chọn', en: 'optional' },
  'brew.rating': { vi: 'Điểm', en: 'Rating' },
  'brew.flavors': { vi: 'Nốt hương bạn nhận ra', en: 'Flavors you noticed' },
  'brew.comment': { vi: 'Ghi chú', en: 'Notes' },
  'brew.commentPh': {
    vi: 'Lần sau sẽ chỉnh gì? Xay mịn hơn, rót chậm hơn…',
    en: 'What would you change next time? Finer grind, slower pour…',
  },
  'brew.needAmounts': {
    vi: 'Cần nhập lượng cà phê và nước.',
    en: 'Coffee and water amounts are required.',
  },
  'brew.badTime': {
    vi: 'Thời gian phải có dạng phút:giây, vd. 3:15.',
    en: 'Time must look like m:ss, e.g. 3:15.',
  },
  'brew.notFound': { vi: 'Không tìm thấy lần pha này.', en: 'This brew could not be found.' },
  'brew.total': { vi: 'lần pha', en: 'brews' },
  'brew.avg': { vi: 'điểm trung bình', en: 'average rating' },
  'brew.byMethod': { vi: 'Theo cách pha', en: 'By method' },
  'brew.topFlavors': { vi: 'Nốt hương hay gặp ở ly 4–5★', en: 'Most common notes in 4–5★ cups' },
  'brew.allMethods': { vi: 'Mọi cách pha', en: 'All methods' },
  'brew.allBeans': { vi: 'Mọi túi hạt', en: 'All beans' },
  'brew.anyRating': { vi: 'Mọi điểm', en: 'Any rating' },
  'brew.again': { vi: 'Pha lại', en: 'Brew again' },
  'brew.empty': {
    vi: 'Chưa có lần pha nào. Mở công cụ pha, bấm giờ, rồi lưu vào nhật ký.',
    en: 'No brews yet. Open the brew tools, run the timer, then save it here.',
  },
  'brew.deleteConfirm': { vi: 'Xóa lần pha này?', en: 'Delete this brew?' },
  'brew.clearConfirm': {
    vi: 'Xóa toàn bộ kệ hạt và nhật ký pha? Không thể hoàn tác nếu chưa sao lưu.',
    en: 'Delete the whole bean shelf and journal? This cannot be undone without a backup.',
  },
  'brew.data': { vi: 'Sao lưu nhật ký', en: 'Journal backup' },
  'brew.dataNote': {
    vi: 'Nhật ký lưu trong IndexedDB của trình duyệt này. Xuất JSON định kỳ để không mất dữ liệu; CSV để mở bằng Excel hoặc phân tích.',
    en: 'The journal lives in this browser’s IndexedDB. Export JSON regularly so nothing is lost; CSV opens in a spreadsheet or analysis tool.',
  },
  'brew.backupNudge': {
    vi: 'Bạn đã ghi thêm 20 lần pha kể từ lần sao lưu trước. Xuất file JSON ở cuối trang nhé.',
    en: 'You have logged 20 brews since the last backup. Export a JSON file at the bottom of this page.',
  },

  'glossary.title': { vi: 'Thuật ngữ', en: 'Glossary' },
  'glossary.subtitle': {
    vi: 'Các từ hay gặp khi đọc về cà phê, giải thích ngắn gọn.',
    en: 'Words you meet when reading about coffee, explained briefly.',
  },
  'glossary.search': { vi: 'Tìm thuật ngữ…', en: 'Find a term…' },

  'footer.about': {
    vi: 'Sổ tay cà phê cá nhân, song ngữ Việt–Anh, mã nguồn mở.',
    en: 'A personal, bilingual (VI/EN) coffee notebook, open source.',
  },
  'footer.rss': { vi: 'RSS', en: 'RSS' },
} satisfies Record<string, I18nText>;

export type I18nKey = keyof typeof DICT;

@Injectable({ providedIn: 'root' })
export class I18n {
  private store = inject(StoreService);
  readonly lang = computed(() => this.store.lang());

  /** Translate a UI key. Reading `lang()` makes templates update on language switch. */
  t(key: I18nKey): string {
    return DICT[key][this.lang()];
  }

  /** Pick the current-language variant of a content string. */
  pick(text: I18nText | undefined | null): string {
    if (!text) return '';
    return text[this.lang()] || text.vi || text.en;
  }

  /** Locale-aware date, e.g. "19 thg 11, 2026" / "Nov 19, 2026". */
  date(iso: string, style: 'short' | 'long' = 'short'): string {
    const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
    return d.toLocaleDateString(this.lang() === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: style === 'long' ? 'long' : 'short',
      year: 'numeric',
    });
  }
}
