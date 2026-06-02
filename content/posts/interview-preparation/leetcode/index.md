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

### [2. 两数相加](https://leetcode.cn/problems/add-two-numbers/)

这道题是给两个逆序的链表，然后我们需要把他们相加的和求出来，因为实际上已经是逆序了，我们就模拟正整数的加法，所以我们就需要考虑整数加法的规则，位数对齐，以及考虑进位，所以我们对链表做循环的时候，条件就是l1 or l2 or carry，然后完整的acm模式代码在下面

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_linked_list(nums):
    dummy = ListNode()
    cur = dummy
    for num in nums:
        cur.next = ListNode(num)
        cur = cur.next
    return dummy.next

def print_linked_list(head):
    result = []
    while head:
        result.append(str(head.val))
        head = head.next
    print(" -> ".join(result))

def addTwoNumbers(l1, l2):
    dummy = ListNode()
    cur = dummy
    carry = 0
    while l1 or l2 or carry:
        if l1:
            carry += l1.val
            l1 = l1.next
        if l2:
            carry += l2.val
            l2 = l2.next
        cur.next = ListNode(carry % 10)
        carry //= 10
        cur = cur.next
    return dummy.next

# 构造链表
l1 = build_linked_list([9,9,9,9,9,9,9])
l2 = build_linked_list([9,9,9,9])

# 计算结果
result = addTwoNumbers(l1, l2)

# 输出结果
print_linked_list(result)
```

### [3. 无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)

这道题比较经典，我就直接上答案了

```python
from typing import Counter
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        cnt = Counter()
        n = len(s)
        ans = 0
        left = 0
        for right, x in enumerate(s):
            cnt[x] += 1
            while cnt[x] > 1:
                cnt[s[left]] -= 1
                left += 1
            ans = max(ans, right - left + 1)
        return ans
        
```



### [4. 寻找两个正序数组的中位数](https://leetcode.cn/problems/median-of-two-sorted-arrays/)

**题目理解：两个有序数组的中位数**

这道题的核心思想是**二分查找划分点**，而不是合并数组。

------

**核心思路**

把两个数组各切一刀，使得：

- 左半部分的所有元素 ≤ 右半部分的所有元素
- 左半部分的元素总数 = `(m + n + 1) / 2`

```
a: [ ... | a[i-1]  |  a[i] ... ]
b: [ ... | b[j-1]  |  b[j] ... ]
          ↑ 左半部分    ↑ 右半部分
```

合法的切法需满足：`a[i-1] ≤ b[j]` 且 `b[j-1] ≤ a[i]`

------

**代码里的技巧**

**加哨兵 `[-inf] + a + [inf]`**

下标从 `1` 开始表示真实元素，`0` 和 `m+1` 是边界哨兵，避免越界判断：

```
下标:  0      1   2  ...  m    m+1
值:  -inf   a[0] a[1] ... a[m-1]  +inf
```

所以代码里 `a[i]` 实际是原数组的 `a[i-1]`，切点 `i` 表示左半部分取了 `i` 个元素。

------

**二分过程**

在较短数组 `a` 上二分切点 `i`（范围 `0~m+1`）：

```python
if a[i] <= b[j + 1]:  # 等价于 a[i-1] <= b[j]，切点可以右移
    left = i
else:                  # a[i-1] > b[j]，切点需要左移
    right = i
```

`j` 由 `i` 决定，保证左半部分总数固定：

```python
j = (m + n + 1) // 2 - i
```

------

**求中位数**

找到合法切点后：

```python
max1 = max(a[i], b[j])      # 左半部分最大值
min2 = min(a[i+1], b[j+1])  # 右半部分最小值
```

- 奇数总长：返回 `max1`
- 偶数总长：返回 `(max1 + min2) / 2`

```python
class Solution:
    def findMedianSortedArrays(self, a: List[int], b: List[int]) -> float:
        if len(a) > len(b):
            a, b = b, a
        m, n = len(a), len(b)
        a = [-inf] + a + [inf]
        b = [-inf] + b + [inf]
        left, right = 0, m + 1
        while left + 1 < right:
            i = (left + right) // 2
            j = (m + n + 1) // 2 - i 
            if a[i] <= b[j + 1]:
                left = i 
            else:
                right = i 
        i = left
        j = (m + n + 1) // 2 - i 
        max1 = max(a[i], b[j])
        min2 = min(a[i + 1], b[j + 1])
        return max1 if (m + n) % 2 else (max1 + min2) / 2
```

### [5. 最长回文子串](https://leetcode.cn/problems/longest-palindromic-substring/)

