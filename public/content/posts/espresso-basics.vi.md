---
title: "Espresso cơ bản: 18 g vào, 36 g ra"
summary: "Công thức khởi đầu cho một shot espresso đôi và cách đọc shot để chỉnh máy xay."
date: 2026-11-21
category: espresso
tags: [espresso, dial-in, cong-thuc]
type: guide
level: intermediate
method: espresso
---

> [!NOTE]
> **Kết quả:** một shot espresso đôi khoảng 36 g. Với espresso, tỉ lệ tính bằng **khối lượng ra cốc** so với bột vào, không phải lượng nước.

## Công thức khởi đầu

Theo các hướng dẫn phổ biến, espresso đặc sản thường chiết ở áp suất khoảng 9 bar, nước 90–96 °C, trong 25–30 giây với tỉ lệ 1:2 — ví dụ 18 g bột ra 36 g ([Coffee Tower](https://coffeetower.pages.dev/coffee/espresso-extraction)).

```brew-calc
method: espresso
coffee: 18
ratio: 2
```

```brew-timer
method: espresso
coffee: 18
water: 36
step: 0:00 | | Bấm chiết, đặt cốc lên cân
step: 0:28 | | Dừng khi cân đạt 36 g
```

## Đọc shot để chỉnh

| Shot | Nguyên nhân thường gặp | Chỉnh |
| --- | --- | --- |
| Ra 36 g trong dưới 20 giây, chua, loãng | Bột thô quá | Xay mịn hơn |
| Mất hơn 35 giây, đắng, chát | Bột mịn quá | Xay thô hơn |
| Đúng thời gian nhưng vẫn gắt | Tỉ lệ chưa hợp hạt | Thử 1:2,2–1:2,5 |

> [!TIP]
> Giữ nguyên lượng bột và lượng ra, chỉ đổi độ xay cho tới khi thời gian vào khoảng 25–30 giây. Sau đó mới thử đổi tỉ lệ để tinh chỉnh vị.
