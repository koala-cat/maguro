import errorCircle from './assets/svg-icons/error-circle'

export default {
  name: 'Tookit',
  props: ['tool', 'svg'],
  computed: {
    viewBox () {
      return this.tool.svg.getAttribute('viewBox')
    },
    innerHTML () {
      return this.tool.svg.innerHTML
    }
  },
  methods: {
    onSelect (e) {
      this.$emit('select', this.tool)
    },
    onMouse (e, val) {
      const el = e?.target || null
      const delEl = el ? el.querySelector('span') : null
      if (delEl) {
        delEl.style.display = val ? 'block' : 'none'
      }
    },
    onMouseover (e) {
      this.onMouse(e, true)
    },
    onMouseleave (e) {
      this.onMouse(e, false)
    },
    onRemove (e) {
      e.stopPropagation()
      this.$emit('remove', this.tool)
    },
    onUpload () {
      this.$emit('upload', this.tool)
    }
  },
  render (h) {
    if (this.tool.value === 'create') {
      return (<a onClick={ this.onUpload }>+</a>)
    } else {
      return (
        <a
          onClick={ this.onSelect }
          onMouseenter={ this.onMouseover }
          onMouseleave={ this.onMouseleave }>
          {
            this.tool.disabled
              ? <span
                style="display:none;"
                onClick={ this.onRemove }>
                <mu-icon
                  svg={ errorCircle }
                  style="position: absolute; top: -6px; right: -6px; fill: #ff0000; font-size: 12px;" />
              </span>
              : undefined
          }
          {
            this.tool.svg
              ? <svg
                viewBox={ this.viewBox }
                width="20"
                height="20"
                fill="#fff"
                style="margin-top: -2px;"
                domPropsInnerHTML={ this.innerHTML } />
              : <img src={ this.tool.iconUrl } />
          }
        </a>
      )
    }
  }
}
