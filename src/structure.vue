<template>
  <mu-v-box>
    <mu-bar>
      <mu-button
        button-style="link"
        style="color: #fff"
        @click="expanded = !expanded">
        <mu-icon
          :svg="getPath()"
          style="fill: #ffffff" />
        关联构筑物
      </mu-button>
    </mu-bar>
    <mu-v-box
      v-show="expanded"
      :size="structures.length > 0 ? 'auto' : '36px'">
      <mu-h-box
        v-if="structures.length > 0"
        cellspacing>
        <mu-editor
          icon="search"
          icon-position="left"
          size="auto"
          placeholder="按构筑物名称搜索"
          @change="onSearch" />
      </mu-h-box>
      <label v-else style="padding: 8px 8px 8px 16px;">
        当前项目下无构筑物
      </label>
      <mu-v-box
        v-show="structures.length > 0"
        size="auto"
        style="margin: 0 8px 8px; background: rgb(37, 73, 95);">
        <mu-h-box
          v-for="item in filterStructures"
          :key="item.id">
          <tree-node
            :node="item"
            :level="0"
            :check-value="overlay.projectStructureId"
            @check="onChecked"
          />
        </mu-h-box>
      </mu-v-box>
    </mu-v-box>
  </mu-v-box>
</template>
<script>
  import debounce from 'lodash.debounce'

  import svg from './assets/svg-icons'

  import TreeNode from './tree-node.vue'

  export default {
    inject: ['baiduMap'],
    components: {
      TreeNode
    },
    props: {
      structures: {
        type: Array,
        default: () => ([])
      },
      overlay: {
        type: Object,
        default: () => ({})
      }
    },
    data () {
      return {
        expanded: false,
        filterStructures: [],
        searchKey: ''
      }
    },
    watch: {
      overlay (val) {
        this.getFilterStructures()
      }
    },
    mounted () {
      this.getFilterStructures()
    },
    methods: {
      getPath () {
        return this.expanded ? svg.triangleDown : svg.triangleRight
      },
      getFilterStructures () {
        const map = {}
        this.filterStructures = []
        for (const item of this.structures) {
          if (!item.name.includes(this.searchKey)) {
            continue
          }

          const categoryId = item.projectStructureCategoryId
          if (!map[categoryId]) {
            const category = {
              id: categoryId,
              projectStructureCategoryId: -1,
              name: item.categoryName || '未分类',
              expanded: false,
              subNodes: []
            }
            map[categoryId] = category
            this.filterStructures.push(category)
          }
          map[categoryId].subNodes.push(item)
        }
      },
      onSearch: debounce(function (val) {
        this.searchKey = val.trim()
        this.getFilterStructures()
      }, 500),
      onChecked (value, structure) {
        const projectStructureId = value ? structure?.id || null : null
        this.baiduMap.updateOverlay('projectStructureId', projectStructureId)
      }
    }
  }
</script>
