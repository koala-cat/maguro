<template>
  <mu-v-box
    size="auto">
    <mu-h-box
      size="auto"
      cellspacing
      :style="{paddingLeft: nodeIntent + 'px'}">
      <mu-icon
        v-show="!isLeaf"
        :svg="svg"
        style="fill: #a5a5a5;margin: 1px 4px 0px 0px;"
        @click="node.expanded=!node.expanded" />
      <div
        size="auto"
        :title="name"
        class="mu-text-ellipsis"
        style="width: 0;">
        {{ name }}
      </div>
      <input
        v-show="isLeaf"
        v-model="check"
        type="checkbox">
    </mu-h-box>
    <mu-v-box
      v-show="expanded">
      <tree-node
        v-for="subNode in subNodes"
        :key="subNode.id"
        :node="subNode"
        :check-value="checkValue"
        :level="level+1"
        v-on="$listeners" />
    </mu-v-box>
  </mu-v-box>
</template>
<script>
  import { collapseCircleSvg, expandCircleSvg } from './assets/svg-icons'

  export default {
    name: 'TreeNode',
    props: {
      node: {
        type: Object,
        default: () => ({})
      },
      level: {
        type: Number,
        default: 0
      },
      checkValue: {
        type: Number,
        default: 0
      }
    },
    data () {
      return {
        checked: []
      }
    },
    computed: {
      nodeIntent () {
        return this.level * 16
      },
      nodeId () {
        return this.node.id
      },
      name () {
        return this.node.name
      },
      check: {
        get () {
          return this.nodeId === this.checkValue
        },
        set (val) {
          this.$emit('check', val, this.node)
        }
      },
      expanded () {
        return this.node.expanded
      },
      svg () {
        return this.expanded ? expandCircleSvg : collapseCircleSvg
      },
      subNodes () {
        return this.node.subNodes || []
      },
      isLeaf () {
        return this.subNodes.length === 0
      }
    }
  }
</script>
