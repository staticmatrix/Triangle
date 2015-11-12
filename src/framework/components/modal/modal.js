/* ========================================================================
 * Bootstrap: modal.js v3.3.5
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


Jx().package("T.UI.Components", function(J){
    // 严格模式
    'use strict';

    // 全局变量、函数、对象
    var VERSION  = '3.3.5';
    var TRANSITION_DURATION = 300;
    var BACKDROP_TRANSITION_DURATION = 150;


    var defaults = {
        show: true,
        backdrop: true,
        keyboard: true
    };
    var attributeMap = {
        modalId:'modal-id',
        show: 'show',
        backdrop: 'backdrop',
        keyboard: 'keyboard'
    };

    var ModalPop = new J.Class({
        // 构造函数
        init:function(elements, options){
            this.inputElements = elements;

            this.options             = options
            this.$body               = $(document.body)
            //this.$element            = $(element)
            this.$element            = this.inputElements.pop;
            this.$dialog             = this.$element.find('.modal-dialog')
            this.$backdrop           = null
            this.isShown             = null
            this.originalBodyPad     = null
            this.scrollbarWidth      = 0
            this.ignoreBackdropClick = false

            
            // this.element = $(element);
            // //this.settings,

            // this.container,
            // this.elements,

            // this.value = this.element.val();

            // // 初始化选项
            // this.initSettings(options);

            // 初始化数据
            this.getData();

            // // 构建html DOM
            // this.buildHtml();
            // // 初始化 html DOM 元素
            // this.initElements();
            // this.transferAttributes();

            // // 创建 树型 菜单对象
            // //this.menu=new LevelMenu(this.elements, this.settings);

            // 绑定事件
            this.bindEvents();
            // // 绑定事件接口
            // this.bindEventsInterface();
        },
        getData: function(){
            if (this.options.remote) {
                this.$element
                    .find('.modal-content')
                    .load(this.options.remote, $.proxy(function () {
                        this.$element.trigger('loaded.bs.modal')
                    }, this))
            }
        },
        bindEvents: function(){
            var context = this;

            this.inputElements.original.on('click', function(e){
                if($(this).is('a')){
                    e.preventDefault();
                }

                context.show(context.inputElements.original);
            });
        },
        toggle: function (_relatedTarget) {
            return this.isShown ? this.hide() : this.show(_relatedTarget)
        },

        show: function (_relatedTarget) {
            var that = this
            var e    = $.Event('show.bs.modal', { relatedTarget: _relatedTarget })

            this.$element.trigger(e)

            if (this.isShown || e.isDefaultPrevented()) return

            this.isShown = true

            this.checkScrollbar()
            this.setScrollbar()
            this.$body.addClass('modal-open')

            this.escape()
            this.resize()

            this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this))

            this.$dialog.on('mousedown.dismiss.bs.modal', function () {
                that.$element.one('mouseup.dismiss.bs.modal', function (e) {
                    if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true
                })
            })

            this.backdrop(function () {
                var transition = $.support.transition && that.$element.hasClass('fade')

                if (!that.$element.parent().length) {
                    that.$element.appendTo(that.$body) // don't move modals dom position
                }

                that.$element
                    .show()
                    .scrollTop(0)

                that.adjustDialog()

                if (transition) {
                    that.$element[0].offsetWidth // force reflow
                }

                that.$element.addClass('in')

                that.enforceFocus()

                var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget })

                transition ?
                    that.$dialog // wait for modal to slide in
                        .one('bsTransitionEnd', function () {
                            that.$element.trigger('focus').trigger(e)
                        })
                        .emulateTransitionEnd(TRANSITION_DURATION) :
                    that.$element.trigger('focus').trigger(e)
            })
        },

        hide: function (e) {
            if (e) e.preventDefault()

            e = $.Event('hide.bs.modal')

            this.$element.trigger(e)

            if (!this.isShown || e.isDefaultPrevented()) return

            this.isShown = false

            this.escape()
            this.resize()

            $(document).off('focusin.bs.modal')

            this.$element
                .removeClass('in')
                .off('click.dismiss.bs.modal')
                .off('mouseup.dismiss.bs.modal')

            this.$dialog.off('mousedown.dismiss.bs.modal')

            $.support.transition && this.$element.hasClass('fade') ?
                this.$element
                    .one('bsTransitionEnd', $.proxy(this.hideModal, this))
                    .emulateTransitionEnd(TRANSITION_DURATION) :
                this.hideModal()
        },

        enforceFocus: function () {
            $(document)
                .off('focusin.bs.modal') // guard against infinite focus loop
                .on('focusin.bs.modal', $.proxy(function (e) {
                    if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
                        this.$element.trigger('focus')
                    }
                }, this))
        },

        escape: function () {
            if (this.isShown && this.options.keyboard) {
                this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
                    e.which == 27 && this.hide()
                }, this))
            } else if (!this.isShown) {
                this.$element.off('keydown.dismiss.bs.modal')
            }
        },

        resize: function () {
            if (this.isShown) {
                $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this))
            } else {
                $(window).off('resize.bs.modal')
            }
        },

        hideModal: function () {
            var that = this
            this.$element.hide()
            this.backdrop(function () {
                that.$body.removeClass('modal-open')
                that.resetAdjustments()
                that.resetScrollbar()
                that.$element.trigger('hidden.bs.modal')
            })
        },

        removeBackdrop: function () {
            this.$backdrop && this.$backdrop.remove()
            this.$backdrop = null
        },

        backdrop: function (callback) {
            var that = this
            var animate = this.$element.hasClass('fade') ? 'fade' : ''

            if (this.isShown && this.options.backdrop) {
                var doAnimate = $.support.transition && animate

                this.$backdrop = $(document.createElement('div'))
                    .addClass('modal-backdrop ' + animate)
                    .appendTo(this.$body)

                this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
                    if (this.ignoreBackdropClick) {
                        this.ignoreBackdropClick = false
                        return
                    }
                    if (e.target !== e.currentTarget) return
                    this.options.backdrop == 'static'
                        ? this.$element[0].focus()
                        : this.hide()
                }, this))

                if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

                this.$backdrop.addClass('in')

                if (!callback) return

                doAnimate ?
                    this.$backdrop
                        .one('bsTransitionEnd', callback)
                        .emulateTransitionEnd(BACKDROP_TRANSITION_DURATION) :
                    callback()

            } else if (!this.isShown && this.$backdrop) {
                this.$backdrop.removeClass('in')

                var callbackRemove = function () {
                    that.removeBackdrop()
                    callback && callback()
                }
                $.support.transition && this.$element.hasClass('fade') ?
                    this.$backdrop
                        .one('bsTransitionEnd', callbackRemove)
                        .emulateTransitionEnd(BACKDROP_TRANSITION_DURATION) :
                    callbackRemove()

            } else if (callback) {
                callback()
            }
        },

        // these following methods are used to handle overflowing modals

        handleUpdate: function () {
            this.adjustDialog()
        },

        adjustDialog: function () {
            var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight

            this.$element.css({
                paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
                paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
            })
        },

        resetAdjustments: function () {
            this.$element.css({
                paddingLeft: '',
                paddingRight: ''
            })
        },

        checkScrollbar: function () {
            var fullWindowWidth = window.innerWidth
            if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
                var documentElementRect = document.documentElement.getBoundingClientRect()
                fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
            }
            this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth
            this.scrollbarWidth = this.measureScrollbar()
        },

        setScrollbar: function () {
            var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
            this.originalBodyPad = document.body.style.paddingRight || ''
            if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
        },

        resetScrollbar: function () {
            this.$body.css('padding-right', this.originalBodyPad)
        },

        measureScrollbar: function () { // thx walsh
            var scrollDiv = document.createElement('div')
            scrollDiv.className = 'modal-scrollbar-measure'
            this.$body.append(scrollDiv)
            var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
            this.$body[0].removeChild(scrollDiv)
            return scrollbarWidth
        }
    });

    this.Modal = new J.Class({extend : T.UI.BaseControl}, {
        defaults: defaults,
        attributeMap: attributeMap,

        init: function(element, options){
            this.element = $(element);

            // 防止多次初始化
            if (this.isInitialized()) { 
                return this.getRef(); 
            }
            this.initialize(element);
            
            //this.container;
            //this.elements;

            // this.value = this.element.val();

            // 初始化选项
            this.initSettings(options);
            var href= this.element.attr('href');
            this.settings.remote= !/#/.test(href) && href;

            // // 初始化数据
            // this.getData();

            // 初始化 html DOM 元素
            this.initElements();

            // 创建 树型 菜单对象
            this.pop=new ModalPop(this.elements, this.settings);

            this.initialized();
        },
        initElements: function(){
            this.elements={
                original: this.element,
                pop: $('#' + this.settings.modalId)
            }
        }
    });
});

/* modal javascript jQuery */

(function($) {
    // 严格模式
    'use strict';

    // 控件类名
    var pluginName = "modal";

        // 胶水代码
    $.fn[pluginName] = function(options) {

        this.each(function () {
            var plugin=new T.UI.Components.Modal(this, $.extend(true, {}, options));
        });

        return this;

    };

})(jQuery);