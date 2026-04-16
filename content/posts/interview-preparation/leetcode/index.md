---
title: "Leetcode题解"
date: 2026-04-16
draft: false
tags: ["leetcode algorithm"]
categories: ["interview-preparation"]
description: "完整的所有的leetcode的题解"
ShowToc: true
TocOpen: true
---



### [1. 两数之和](https://leetcode.cn/problems/two-sum/)

这道题比较经典，定义一个哈希表，key是num，value是idx，然后就是遍历数组，需要注意的是，如果在acm模式下，需要注意导包

```python
from typing import List
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        idx = defaultdict(int)
        ans = []
        for i, x in enumerate(nums):
            if target - x in idx:
                return [i, idx[target - x]]
            else:
                idx[x] = i 
        return []
```

