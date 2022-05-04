
/**
 * 
 * vdom  虚拟节点
 * old 老的节点
 * new 新的节点
 * 
 * 
 * mountElement 新增元素
 * patch 复用元素
 * unmoubt 删除元素
 * move 元素移动
 * 
 * @param {*} c1 
 * @param {*} c2 
 * @param {*} param2 
 */


exports.diffArray = (c1, c2, { mountElement, patch, unmount, move }) => {
  // 默认同一层级
  function isSameVnodeType(n1, n2) {
    return n1.key === n2.key // && n1.type === n2.type 
  }

  let l1 = c1.length // 老节点的长度
  let l2 = c2.length // 新节点的长度
  let i = 0
  let e1 = l1 - 1 // 老节点最后一个节点的索引
  let e2 = l2 - 1 // 新节点最后一个节点的索引

  // 1.从左边开始查找
  while (i <= e1 && i <= e2) {
    const n1 = c1[i] // 获取老节点
    const n2 = c2[i] // 获取新节点
    if (isSameVnodeType(n1, n2)) { //如果新老节点是相同的节点
      // patch
      patch(n1.key)
    } else {
      break;
    }
    i++
  }


  // 2.从右边开始查找
  while (i <= e1 && i <= e2) {
    const n1 = c1[e1] // 获取老节点
    const n2 = c2[e2] // 获取新节点
    if (isSameVnodeType(n1, n2)) { //如果新老节点是相同的节点
      // patch
      patch(n1.key)
    } else {
      break;
    }
    e1--
    e2--
  }

  // 3.老节点没有了  新节点存在  则新增
  if (i > e1) {
    if (i <= e2) {
      while (i <= e2) {
        const n2 = c2[i]
        mountElement(n2.key)
        i++
      }
    }
  }
  // 4.老节点存在  新节点没有  则删除
  else if (i > e2) {
    if (i <= e1) {
      while (i <= e1) {
        const n1 = c1[i]
        unmount(n1.key)
        i++
      }
    }
  }

  // 5.新老节点都有  顺序不稳定
  else {
    const s1 = i
    const s2 = i
    // 剩下的就是中间乱序的数组进行遍历
    // 1. 暴力解法  双重遍历， 时间复杂度O(n^2)
    // 2. 构建一个map映射表 每次遍历老的节点去这个映射表中查找
    const keyToNewIndexMap = new Map()
    // 大概就是这个样子
    // {
    //   e: 2,
    //   c: 3,
    //   d: 4,
    //   h: 5
    // }
    for (i = s2; i <= e2; i++) {
      const nextChild = c2[i]
      keyToNewIndexMap.set(nextChild.key, i)
    }
    console.log(keyToNewIndexMap);


    // 记录新节点有多少个需要处理的
    const toBePatched = e2 - s2 + 1
    let patched = 0 //记录老节点有多少个复用
    // 构建一个数组记录一下在新节点的位置 在老节点中的位置
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

    // 数组的下标是新节点元素的相对下标
    // 数组的值如果是0 证明这个值是需要新增的
    // 否则就是新节点在老节点的位置
    // console.log(newIndexToOldIndexMap);

    let moved = false
    let maxNewIndexSoFar = 0

    // 遍历老的节点 去map图中查找 老的节点在新的节点中对应的位置
    for (i = s1; i <= e1; i++) {
      const prevChild = c1[i]
      const newIndex = keyToNewIndexMap.get(prevChild.key)
      // 如果老的节点在map中没有找到说明这个节点需要移除
      if (!newIndex) {
        unmount(prevChild.key)
      } else {

        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex
        } else {
          moved = true
        }

        //如果老的节点在map中找到了 则说明这个节点可以复用
        //然后在newIndexToOldIndexMap中记录老节点在新节点中的位置
        // 为什么要+1？
        // 索引是从0开始的  newIndexToOldIndexMap 中的值为0 代表新增
        newIndexToOldIndexMap[newIndex - s2] = i + 1
        patch(prevChild.key)
        patched++
      }
    }
    // e c d h
    // [5,3,4,0]
    // 获取最长递增子序列
    [1, 2]
    const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
    let lastIndex = increasingNewIndexSequence.length - 1

    // Dom  操作 insertBefore  所以从右向左遍历
    for (i = toBePatched - 1; i >= 0; i--) {
      const newChild = c2[s2 + i]
      // 判断节点是新增还是移动
      if (newIndexToOldIndexMap[i] === 0) {
        mountElement(newChild.key)
      } else {
        if (lastIndex < 0 || i !== increasingNewIndexSequence[lastIndex]) {
          move(newChild.key)
        } else {
          lastIndex--
        }
      }
    }
  }







  // 返回不需要移动的节点
  // 得到最长递增子序列lis（算法+实际应用，跳过0），返回路径
  function getSequence(arr) {
    // return [1, 2];

    // 最长递增子序列路径, 有序递增
    const lis = [0];

    // 相当于复制一份arr数组，此数组用于稍后纠正lis用的
    const recordIndexOfI = arr.slice();

    const len = arr.length;
    for (let i = 0; i < len; i++) {
      const arrI = arr[i];
      // 如果元素值为0，证明节点是新增的，老dom上没有，肯定不需要移动，所以跳过0，不在lis里
      if (arrI !== 0) {
        // 判断arrI插入到lis哪里
        const last = lis[lis.length - 1];
        // arrI比lis最后一个元素还大，又构成最长递增
        if (arr[last] < arrI) {
          // 记录第i次的时候，本来的元素是什么，后面要做回溯的
          recordIndexOfI[i] = last;
          lis.push(i);
          continue;
        }
        // 二分查找插入元素
        let left = 0,
          right = lis.length - 1;
        while (left < right) {
          const mid = (left + right) >> 1;
          //  0 1 2 3 4 (1.5)
          if (arr[lis[mid]] < arrI) {
            // mid< 目标元素 ， 在右边
            left = mid + 1;
          } else {
            right = mid;
          }
        }

        if (arrI < arr[lis[left]]) {
          // 从lis中找到了比arrI大的元素里最小的那个，即arr[lis[left]]。
          // 否则则没有找到比arrI大的元素，就不需要做什么了
          if (left > 0) {
            // 记录第i次的时候，上次的元素的是什么，便于后面回溯
            recordIndexOfI[i] = lis[left - 1];
          }
          lis[left] = i;
        }
      }
    }

    // 遍历lis，纠正位置
    let i = lis.length;
    let last = lis[i - 1];

    while (i-- > 0) {
      lis[i] = last;
      last = recordIndexOfI[last];
    }

    return lis;
  }

}