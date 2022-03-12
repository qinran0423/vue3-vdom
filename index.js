
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

  // 1. 从左到右一直查找新老是够可以复用， 如果不可以则停止循环
  while (i <= e1 && i <= e2) {
    const n1 = c1[i]
    const n2 = c2[i]
    if (isSameVnodeType(n1, n2)) {
      patch(n1.key)
    } else {
      break
    }
    i++
  }

  // 2. 从右到左一直查找新老是够可以复用， 如果不可以则停止循环
  while (i <= e1 && i <= e2) {
    const n1 = c1[e1]
    const n2 = c2[e2]
    if (isSameVnodeType(n1, n2)) {
      patch(n1.key)
    } else {
      break
    }
    e1--
    e2--
  }

  // 3-1 老节点没了  新节点有
  if (i > e1) {
    if (i <= e2) {
      while (i <= e2) {
        const n2 = c2[i]
        mountElement(n2.key)
        i++
      }
    }
  }

  // 3-2 老节点存在  新节点没有
  else if (i > e2) {
    if (i <= e1) {
      while (i <= e1) {
        const n1 = c1[i]
        unmount(n1.key)
        i++
      }
    }
  } else {
    // 4 新老节点都有，但是顺序不稳定，乱

    // 4-1 把新元素做成map， key: value(索引)
    const s1 = i
    const s2 = i

    const keyToNewIndexMap = new Map()
    for (i = s2; i <= e2; i++) {
      const nextChild = c2[i]
      keyToNewIndexMap.set(nextChild.key, i)
    }
    // 记录新节点有多少个还没处理
    const toBePatched = e2 - s2 + 1
    let patched = 0

    // 4-2  记录一下新老元素的相对下标 
    const newIndexToOldIndexMap = new Array(toBePatched)

    // 数组的下标记录的是新元素的相对下标
    // 数组的值如果是0 证明这个值得新元素是要新增的
    for (let i = 0; i < toBePatched; i++) {
      newIndexToOldIndexMap[i] = 0
    }

    // 4-3 遍历老节点 去map图查找节点 确定是复用还是删除
    let moved = false
    let maxNewIndexSoFar = 0

    for (i = s1; i <= e1; i++) {
      const prevChild = c1[i]
      if (patched >= toBePatched) {
        unmount(prevChild.key)
        continue
      }
      const newIndex = keyToNewIndexMap.get(prevChild.key)

      if (newIndex === undefined) {
        //没有找到要复用的节点，则删除
        unmount(prevChild.key)
      } else {
        // maxNewIndexSoFar 记录队伍最后一个元素的下标 
        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex
        } else {
          moved = true
        }
        // 找到了节点需要被复用
        // 一旦元素可以复用 newIndexToOldIndexMap对应的相对位置 更新更老元素的下标+1
        newIndexToOldIndexMap[newIndex - s2] = i + 1
        patch(prevChild.key)
        patched++
      }
    }

    // 4-3 遍历新元素 新增 或 移动

    // 获取最长递增子序列
    const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
    let lastIndex = increasingNewIndexSequence.length - 1
    for (i = toBePatched - 1; i >= 0; i--) {
      // i 是新元素的相对下标
      const nextChild = c2[s2 + i]

      // 判断节点是新增 还是 移动
      if (newIndexToOldIndexMap[i] === 0) {
        mountElement(nextChild.key)
      } else {
        // 可能需要移动  最长递增子序列
        if (lastIndex < 0 || i !== increasingNewIndexSequence[lastIndex]) {
          move(nextChild.key)
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