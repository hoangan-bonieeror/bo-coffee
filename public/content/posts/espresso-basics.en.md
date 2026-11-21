---
title: "Espresso basics: 18 g in, 36 g out"
summary: "A starting recipe for a double espresso and how to read a shot to adjust your grinder."
date: 2026-11-21
category: espresso
tags: [espresso, dial-in, cong-thuc]
type: guide
level: intermediate
method: espresso
---

> [!NOTE]
> **Result:** a double espresso of about 36 g. For espresso, the ratio compares **liquid out** with dry coffee in, not water used.

## Starting recipe

Common guidance for specialty espresso is about 9 bar of pressure, water at 90–96 °C and 25–30 seconds at a 1:2 ratio — for example 18 g of coffee in, 36 g out ([Coffee Tower](https://coffeetower.pages.dev/coffee/espresso-extraction)).

```brew-calc
method: espresso
coffee: 18
ratio: 2
```

```brew-timer
method: espresso
coffee: 18
water: 36
step: 0:00 | | Start the shot, cup on the scale
step: 0:28 | | Stop when the scale reads 36 g
```

## Reading the shot

| Shot | Common cause | Adjust |
| --- | --- | --- |
| 36 g in under 20 s, sour, thin | Grind too coarse | Grind finer |
| Over 35 s, bitter, harsh | Grind too fine | Grind coarser |
| Right time but still sharp | Ratio doesn't suit the beans | Try 1:2.2–1:2.5 |

> [!TIP]
> Keep the dose and yield fixed and change only the grind until the time lands around 25–30 seconds. Only then play with the ratio to fine-tune flavor.
