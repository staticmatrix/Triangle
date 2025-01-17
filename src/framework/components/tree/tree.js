/* =========================================================
 * bootstrap-treeview.js v1.2.0
 * =========================================================
 * Copyright 2013 Jonathan Miles
 * Project URL : http://www.jondmiles.com/bootstrap-treeview
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


 /*
    1. removed css (move to tree.less)
    2. removed buildStyleOverride
 */

Jx().package("T.UI.Components", function(J){
    // 严格模式
    'use strict';

    // 勾选框是否显示
    var enumShowCheckbox= {
        none: 'none',       // 0 所有节点都不显示勾选框(默认)
        all: 'all',         // 1 所有节点都显示勾选框        
        leaf: 'leaf'        // 2 仅叶子节点显示勾选框
    };

    // 勾选框选中状态
    var enumCheckedState= {
        unchecked: 'unchecked', // 0 选中(默认)
        checked: 'checked',     // 1 未选中
        partOf: 'partOf'        // 2 部分子节点选中
    };

    // 节点是否可选
    var enumSelectMode= {
        // none: 'none',       // 0 所有不可选中(默认) TODO:逻辑代码未实现
        all: 'all',         // 1 所有可选中
        leaf: 'leaf'        // 2 仅叶子节点可选中
    };

    var emptyFun= function(){};

    // 全局变量、函数、对象
    var defaults = {
        // id: 'id',               // id数据字段名称
        // children: 'children',   // 子节点数据字段名称
        levels: 2,
        dataUrl: '',

        // expandIcon: 'glyphicon glyphicon-plus',
        // collapseIcon: 'glyphicon glyphicon-minus',
        expandIcon: 'glyphicon glyphicon-chevron-right',
        collapseIcon: 'glyphicon glyphicon-chevron-down',        
        emptyIcon: 'glyphicon',
        nodeIcon: '',
        selectedIcon: '',
        checkedIcon: 'glyphicon glyphicon-check',
        // checkedPartOfIcon: 'glyphicon glyphicon-checked-partof', // 图标用checked，颜色用灰色(黑灰白)
        uncheckedIcon: 'glyphicon glyphicon-unchecked',

        enableLinks: false,
        enableTitle: false,
        showIcon: true,
        // showCheckbox: false,
        showTags: false,
        multiSelect: false,

        // nodeOptions
        silent: false,
        ignoreChildren: false,

        // extend
        showCheckbox: enumShowCheckbox.none,
        checkRecursive: false,
        selectMode: enumSelectMode.none,
        // appendHtml: '',
        // parseAppendHtml: undefined, // for angularjs: function(html){ return $compile(html)($scope); }

        selectedNodeIds: '',
        checkedNodeIds: '',

        // Event handlers
        onNodeChecked: emptyFun,
        onNodeCollapsed: emptyFun,
        onNodeDisabled: emptyFun,
        onNodeEnabled: emptyFun,
        onNodeExpanded: emptyFun,
        onNodeSelected: emptyFun,
        onNodeUnchecked: emptyFun,
        onNodeUnselected: emptyFun,
        onSearchComplete: emptyFun,
        onSearchCleared: emptyFun
    };

    var attributeMap = {
        expandIcon: 'expand-icon',
        collapseIcon: 'collapse-icon',

        enableTitle: 'enable-title',
        showTags: 'show-tags',
        levels: 'levels',        
        multiSelect: 'multi-select',

        dataUrl: 'data-url',

        selectedNodeIds: 'selected-node-ids',
        checkedNodeIds: 'checked-node-ids'
    };

    // var state= jqNode.find('.expand-icon').hasClass(this.settings.expandIcon);
    // fix for multi class in this.settings.expandIcon, like: 'glyphicon glyphicon-chevron-right'
    function hasClasses(jqElement, classes){
        var arrClass= classes.split(' ');
        var has= true;
        for(var i=0; i< arrClass.length; i++){
            if(!jqElement.hasClass(arrClass[i])){
                has= false;
                break;
            }
        }
        return has;
    }

    this.Tree = new J.Class({extend : T.UI.BaseControl}, {
        defaults : defaults,
        attributeMap : attributeMap,


        // 构造函数
        init: function(element, options){
            // -----------------------------------------------
            // options
            // -----------------------------------------------
            // 初始化选项
            // this.initSettings(this.element, options);
            var jqElement=$(element);
            this.initSettings(jqElement, options);
            if (typeof (this.settings.parseData) === 'function') {
                this.parseData = this.settings.parseData;
                delete this.settings.parseData;
            }

            // -----------------------------------------------
            // value
            // -----------------------------------------------
            // this.value = this.element.val();

            // -----------------------------------------------
            // data
            // -----------------------------------------------
            this.data= [];
            this.idIndexMap= {};

            var context= this;
            // 初始化数据
            $.when(this.getData())
             .done(function(){
                context.render(jqElement);
            });
        },

        getData: function(){
            var d = $.Deferred();

            if (this.settings.data) {
                var data = $.extend(true, [], this.settings.data);
                this.data= this.parseData(data);
                delete this.settings.data;

                d.resolve();
                return d.promise();
            }

            var context = this;
            $.ajax({
                dataType: 'json',
                url: context.settings.dataUrl,
                data: {},
                success: function(data){
                    var innerData= context.parseData(data);
                    context.data= innerData;    //$.extend(true, [], innerData);
                    d.resolve();
                },
                error: function(xmlHttpRequest, status, error){
                    alert('控件id：' + context.element.attr('id')+'，ajax获取数据失败!');

                    d.resolve();
                }
            });

            return d.promise();
        },

        parseData: function(data){
            var innerData= [];

            var index= 0;
            var context= this;
            function recurseTree (node, level) {
                if (!node.nodes) return;

                level ++;

                // $.each(node.nodes, function checkStates(index, node) {
                for(var i=0; i<node.nodes.length; i++){
                    var child= node.nodes[i];

                    // nodeId : unique, incremental identifier
                    // child._innerId = this.nodes.length;
                    child.id = child.id || index;
                    child._innerParentId = node.id;
                    child._innerPath = (node._innerPath || 'r') + '|' + child.id;
                    child._innerLevel = level;

                    innerData.push(child);
                    var idProperty= 'id_' + child.id;
                    context.idIndexMap[idProperty] = index;

                    index ++

                    // recurse child nodes and transverse the tree
                    if (child.nodes) {
                        recurseTree(child, level);
                    }
                }
            }

            recurseTree({ nodes: data }, 0);

            return innerData;
        },

        updateData: function(data){
            var innerData= $.extend(true, [], data);
            this.data= this.parseData(data);
        },

        render: function(jqElement){
            // -----------------------------------------------
            // html
            // -----------------------------------------------
            this.buildHtml(jqElement);
            // this.transferAttributes();
            this.initElements(jqElement);
            this.refresh();
            // -----------------------------------------------
            // states
            // -----------------------------------------------
            // this.initStates(jqElement);
            // -----------------------------------------------
            // events
            // -----------------------------------------------
            // this.buildObservers();
            this.bindEvents();
            // this.bindEventsInterface();
        },

        buildHtml: function(element){
            element.addClass('t-tree');
            this.container = $('<ul class="list-group"></ul>'); // list
            element
                .empty()
                .append(this.container);
        },

        initElements: function(element){
            var context= this;

            this.elements={
                original: element,
                getAllNodes: function(){
                    var allNodes= $('li', context.container);
                    return allNodes;
                },
                getNode: function(nodeId){
                    var child= $('li[data-id="'+nodeId+'"]', context.container);
                    return child;
                },
                getChildNodes: function(nodeId){
                    var jqNode= this.getNode(nodeId);
                    var path= jqNode.data('path');
                    var children= $('li[data-path^="'+path+'|"]', context.container);
                    return children;
                },
                getChildNodesChecked: function(nodeId){
                    var jqNode= this.getNode(nodeId);
                    var path= jqNode.data('path');
                    var children= $('li.node-checked[data-path^="'+path+'|"]', context.container);
                    return children;
                },
                getChildNodesCheckedPartOf: function(nodeId){
                    var jqNode= this.getNode(nodeId);
                    var path= jqNode.data('path');
                    var children= $('li.node-checked-partof[data-path^="'+path+'|"]', context.container);
                    return children;
                },
                getLevelNodes: function(level){
                    var child= $('li[data-level="'+level+'"]', context.container);
                    return child;
                },
                getSelectedNodes: function(unselected){
                    var nodeSelector= unselected ? 'li:not(.node-selected)' : 'li.node-selected';
                    var selectedNodes = $(nodeSelector, context.container);
                    return selectedNodes;
                },
                getCheckedNodes: function(unchecked){
                    var nodeSelector= unchecked ? 'li:not(.node-checked)' : 'li.node-checked';
                    var checkedNodes= $(nodeSelector, context.container);
                    return checkedNodes;
                },
                getDisabledNodes: function(disabled){
                    var nodeSelector= disabled ? 'li:not(.node-disabled)' : 'li.node-disabled';
                    var checkedNodes= $(nodeSelector, context.container);
                    return checkedNodes;
                },
                getSearchResultNodes: function(notResult){
                    var nodeSelector= notResult ? 'li:not(.search-result)' : 'li.search-result';
                    var checkedNodes= $(nodeSelector, context.container);
                    return checkedNodes;
                }
            };
        },

        buildTree: function () {    // nodes, level
            // if (!nodes) return;
            // level += 1;

            for(var i=0; i<this.data.length; i++){  // nodes
                var node=this.data[i];

                var item= this.buildItem(node);

                // Add item to the tree
                this.container.append(item);

                // // Recursively add child ndoes
                // if (node.nodes) {   // && !node.state.disabled && node.state.expanded TODO:移除原有expanded机制，改为显示/隐藏模式
                //     this.buildTree(node.nodes, level);
                // }
            }
        },

        buildItem: function(node){
            var hasChildren= node.nodes && node.nodes.length>0;

            // indent
            var indent= '';
            for (var j = 0; j < (node._innerLevel - 1); j++) {
                indent+='<span class="indent"></span>';
            }

            // icon
            // var cssClassIcon= 'icon';
            // if (node.nodes) {
            //     cssClassIcon += node.state.expanded ? ' expand-icon '+this.settings.collapseIcon : ' expand-icon '+this.settings.expandIcon;
            // }
            // else {
            //     cssClassIcon += ' ' + this.settings.emptyIcon;
            // }
            var cssClassIcon= 'icon';
            if (hasChildren) {
                cssClassIcon += node._innerLevel < this.settings.levels ? ' expand-icon '+this.settings.collapseIcon : ' expand-icon '+this.settings.expandIcon;
            }
            else {
                cssClassIcon += ' ' + this.settings.emptyIcon;
            }

            var icon= '<span class="'+cssClassIcon+'"></span>';

            // node icon
            var nodeIcon= '';
            if (this.settings.showIcon) {
                var cssClassNodeIcon= 'icon node-icon ';
                // if (node.state.selected) {
                //     cssClassNodeIcon += (node.selectedIcon || this.settings.selectedIcon || node.icon || this.settings.nodeIcon);
                // }
                // else{
                //     cssClassNodeIcon += (node.icon || this.settings.nodeIcon);
                // }
                cssClassNodeIcon += (node.icon || this.settings.nodeIcon);
                nodeIcon= '<span class="'+cssClassNodeIcon+'"></span>'; // icon
            }

            // Add check / unchecked icon
            var check= '';
            // if (this.settings.showCheckbox) {
            if (this.settings.showCheckbox === enumShowCheckbox.all || (!hasChildren && this.settings.showCheckbox === enumShowCheckbox.leaf)) {
                var cssClassCheck= 'icon check-icon ';
                // if (node.state.checked) {
                //     cssClassCheck += this.settings.checkedIcon; 
                // }
                // else {
                //     cssClassCheck += this.settings.uncheckedIcon;
                // }
                cssClassCheck += this.settings.uncheckedIcon;
                check= '<span class="'+ cssClassCheck +'"></span>';
            }

            // tags as badges
            var badge= '';
            if (this.settings.showTags && node.tags) {
                for(var k=0; k<node.tags.length; k++){
                    var tag=node.tags[k];
                    badge += '<span class="badge">'+tag+'</span>';  // badge
                }
            }

            // append html to li
            // var appendHtml= this.settings.appendHtml;
            // if(appendHtml){
            //     if(this.settings.parseAppendHtml){
            //         appendHtml= this.settings.parseAppendHtml(appendHtml);
            //     }
            //     // else{
            //     //     appendHtml= this.settings.appendHtml
            //     // }
            // }

            // item
            var cssClass= 'list-group-item';
            // cssClass += node.state.checked ? ' node-checked' : '';
            // cssClass += node.state.disabled ? ' node-disabled' : '';
            // cssClass += node.state.selected ? ' node-selected' : '';
            // cssClass += node.searchResult ? ' search-result' : '';
            if(hasChildren){
                // cssClass += 'has-children';
                if(this.settings.selectNode === enumSelectMode.leaf){
                    cssClass += ' node-unselelctable';
                }
            }
            var item= ''+
                '<li '+
                '   class="' + cssClass + '" '+
                (this.settings.levels && node._innerLevel > this.settings.levels ? 
                '   style="display: none;"' : '')+  // 隐藏应该折叠的nodes
                (this.settings.enableTitle ? 
                '   title="'+node.text+'"' : '')+
                '   data-id="'+node.id+'"'+
                '   data-level="'+node._innerLevel+'"'+
                '   data-path="'+node._innerPath+'">'+
                indent +
                icon +
                nodeIcon +
                check +
                (this.settings.enableLinks ? 
                '   <a href="'+node.href+'" style="color:inherit;">'+node.text+'</a>' : node.text) +
                // appendHtml+
                badge +
                '</li>';

            return item;
        },

        refresh: function () {
            this.container.empty();
            this.buildTree();
            this.initStates();
        },

        initStates: function(){
            if(this.settings.selectedNodeIds){
                this.selectedNodeByIds(this.settings.selectedNodeIds);
            }
            if(this.settings.checkedNodeIds){
                this.selectedNodeByIds(this.settings.checkedNodeIds);
            }
        },

        // 点击事件处理器
        clickHandler: function (event) {

            if (!this.settings.enableLinks) {
                event.preventDefault();
            }

            var target = $(event.target);
            var jqNode = target.closest('li.list-group-item');
            if (jqNode.hasClass('node-disabled')) {
                return;
            }
            
            var nodeId = jqNode.data('id');

            var classList = target.attr('class') ? target.attr('class').split(' ') : [];
            if ((classList.indexOf('expand-icon') !== -1)) {
                this.toggleExpandedState(nodeId, this.settings.silent, this.settings.ignoreChildren);
                return;
            }

            if ((classList.indexOf('check-icon') !== -1)) {                
                this.toggleCheckedState(nodeId, this.settings.silent);
                return;
            }

            // if (node.selectable) {
            //     this.toggleSelectedState(nodeId, this.settings.silent);
            // } else {
            //     this.toggleExpandedState(nodeId, this.settings.silent);
            // }
            if(!jqNode.hasClass('node-unselelctable')){
                this.toggleSelectedState(nodeId, this.settings.silent);
            }
        },

        // -------------------------------------------------------------------
        // 展开 / 折叠
        // -------------------------------------------------------------------

        setExpandedState: function (nodeId, state, silent, ignoreChildren) {
            var jqNode= this.elements.getNode(nodeId);
            var jqChildren= this.elements.getChildNodes(nodeId);

            if (jqChildren.length>0 && !ignoreChildren) {
                var context= this;
                jqChildren.each(function(){
                    var nodeId= $(this).data('id');
                    context.setExpandedState(nodeId, state, silent, ignoreChildren);
                });
            }

            if (state) {
                jqNode.find('.expand-icon').removeClass(this.settings.expandIcon).addClass(this.settings.collapseIcon);                
                jqChildren.show();

                if (!silent) {
                    this.elements.original.trigger('nodeExpanded', nodeId);
                }
            } else {
                jqNode.find('.expand-icon').removeClass(this.settings.collapseIcon).addClass(this.settings.expandIcon);
                jqChildren.hide();

                if (!silent) {
                    this.elements.original.trigger('nodeCollapsed', nodeId);
                }
            }
        },

        collapseNode: function (nodeIds, silent, ignoreChildren) {
            for(var i=0; i<nodeIds.length; i++){
                this.setExpandedState(nodeIds[i], false, silent, ignoreChildren);
            }
        },

        expandNode: function (nodeIds, levels, silent, ignoreChildren) {
            for(var i=0; i<nodeIds.length; i++){
                var nodeId= nodeIds[i];

                this.setExpandedState(nodeId, true, silent, ignoreChildren);

                var children= this.elements.getChildNodes(nodeId);
                levels= levels || this.settings.levels;
                if (children.length>0 && levels) {
                    var arrNodeId= [];
                    children.each(function(){
                        arrNodeId.push($(this).data('id'));
                    });
                    this.expandLevels(arrNodeId, levels-1, silent, ignoreChildren);
                }
            }
        },

        toggleExpandedState: function (nodeId, silent, ignoreChildren) {
            var jqNode= this.elements.getNode(nodeId);
            var jqExpand= jqNode.find('.expand-icon');

            var state= hasClasses(jqExpand, this.settings.collapseIcon);

            this.setExpandedState(nodeId, !state, silent, ignoreChildren);
        },

        toggleNodeExpanded: function (nodeIds, silent, ignoreChildren) {
            for(var i=0; i<nodeIds.length; i++){
                this.toggleExpandedState(nodeIds[i], silent, ignoreChildren);
            }
        },

        expandLevels: function (nodeIds, levels, silent, ignoreChildren) {
            for(var i=0; i<nodeIds.length; i++){
                var nodeId= nodeIds[i];
                this.setExpandedState(nodeId, levels > 0, silent, ignoreChildren); //  (level > 0) ? true : false
                var children= this.elements.getChildNodes(nodeId);
                if(children.length>0){
                    var arrNodeId= [];
                    children.each(function(){
                        arrNodeId.push($(this).data('id'));
                    });

                    this.expandLevels(arrNodeId, levels-1, silent, ignoreChildren);
                }
            }
        },

        expandAll: function (levels, silent, ignoreChildren) {
            var levels= levels || this.settings.levels;
            if (levels) {
                var arrNodeId=[];
                for(var i=0; i<this.data.length; i++){
                    arrNodeId.push(this.data[i].id);
                }

                this.expandLevels(arrNodeId, levels, silent, ignoreChildren);   // this.data
            }
            else {
                var nodes= this.elements.getLevelNodes(1);
                var context= this;
                nodes.each(function(){
                    var nodeId= $(this).data('id');
                    context.setExpandedState(nodeId, true, silent, ignoreChildren);
                });
            }
        },

        collapseAll: function (silent, ignoreChildren) {
            var nodes= this.elements.getLevelNodes(1);
            var context= this;
            nodes.each(function(){
                var nodeId= $(this).data('id');
                context.setExpandedState(nodeId, false, silent, ignoreChildren);
            });
        },        

        // -------------------------------------------------------------------
        // 选中
        // -------------------------------------------------------------------

        setSelectedState: function (nodeId, state, silent) {
            var jqNode= this.elements.getNode(nodeId);

            if(jqNode.hasClass('node-unselelctable')){
                return;
            }

            if (state) {
                if (!this.settings.multiSelect) {
                    this.elements.getSelectedNodes(false).removeClass('node-selected');
                }

                jqNode.addClass('node-selected');
                if (!silent) {
                    this.elements.original.trigger('nodeSelected', nodeId);
                }
            }
            else {
                jqNode.removeClass('node-selected');
                if (!silent) {
                    this.elements.original.trigger('nodeUnselected', nodeId);
                }
            }
        },

        selectNode: function (nodeIds, silent) {
            for(var i=0; i<nodeIds.length; i++){
                this.setSelectedState(nodeIds[i], true, silent);
            }
        },

        unselectNode: function (nodeIds, silent) {
            for(var i=0; i<nodeIds.length; i++){
                this.setSelectedState(nodeIds[i], false, silent);
            }
        },

        toggleSelectedState: function (nodeId, silent) {
            var jqNode= this.elements.getNode(nodeId);
            var state= jqNode.hasClass('node-selected');

            this.setSelectedState(nodeId, !state, silent);
        },

        toggleNodeSelected: function (nodeIds, silent) {
            for(var i=0; i<nodeIds.length; i++){
                this.toggleSelectedState(nodeIds[i], silent);
            }
        },

        // -------------------------------------------------------------------
        // checkbox
        // -------------------------------------------------------------------

        setCheckedState: function(nodeId, state, silent){
            this._innerSetChcekedState(nodeId, state, silent);

            // 级联勾选
            if(this.settings.checkRecursive){
                var node= this.getNode(nodeId); // TODO:直接用dom里的数据，不要用this.data和this.getNode()
                this.checkRecursiveParent(node, state, silent);
                this.checkRecursiveChildren(node, state, silent);
            }
        },

        _innerSetChcekedState: function(nodeId, state, silent){
            var jqNode= this.elements.getNode(nodeId);
            var jqCheck= jqNode.find('.check-icon');

            switch(state){
                case enumCheckedState.checked: {
                    jqNode
                        .removeClass('node-checked-partof')
                        .addClass('node-checked');
                    jqCheck
                        .removeClass(this.settings.uncheckedIcon)
                        .removeClass(this.settings.checkedpartOfIcon)
                        .addClass(this.settings.checkedIcon);

                    if (!silent) {
                        // this.elements.original.trigger('nodeChecked', $.extend(true, {}, node));
                        this.elements.original.trigger('nodeChecked', nodeId);
                    }

                    break;
                }
                case enumCheckedState.unchecked: {
                    jqNode
                        .removeClass('node-checked')
                        .removeClass('node-checked-partof');
                    jqCheck
                        .removeClass(this.settings.checkedIcon)
                        .removeClass(this.settings.checkedpartOfIcon)
                        .addClass(this.settings.uncheckedIcon);

                    if (!silent) {
                        this.elements.original.trigger('nodeUnchecked', nodeId);
                    }

                    break;
                }
                case enumCheckedState.partof: {
                    jqNode
                        .removeClass('node-checked')
                        .addClass('node-checked-partof');
                    jqCheck
                        .removeClass(this.settings.checkedIcon)
                        .removeClass(this.settings.uncheckedIcon)
                        .addClass(this.settings.checkedpartOfIcon);

                    if (!silent) {
                        this.elements.original.trigger('nodeUnchecked', nodeId);
                    }

                    break;
                }
            }
        },

        checkRecursiveParent: function(node, state, silent){
            // if(!node._innerParentId){
            // 可能等于0
            if(typeof node._innerParentId === 'undefined'){
                return;
            }

            var parent= this.getNode(node._innerParentId);
            while(parent){
                var parentState;
                switch(state){
                    case enumCheckedState.checked: 
                    case enumCheckedState.unchecked: {
                        // 条件1 state= checked / unchecked
                        // 条件2 Sibling is all checked or has CheckedPartOf
                        // var isSiblingAllSameCheckedState= false;

                        var numberOfSiblingCheckedPartOf= this.elements.getChildNodesCheckedPartOf(parent.id).length;
                        if(numberOfSiblingCheckedPartOf > 0){
                            parentState= enumCheckedState.partOf;
                        }
                        else{
                            var numberOfSiblingChecked= this.elements.getChildNodesChecked(parent.id).length;
                            if(numberOfSiblingChecked === 0){
                                parentState= enumCheckedState.unchecked;
                            }
                            else{
                                // var numberOfSibling= this.elements.getChildNodes(parent.id).length;
                                // if(numberOfSiblingChecked === numberOfSibling){
                                parentState= enumCheckedState.checked;
                                // }
                            }
                        }

                        break;
                    }
                    case enumCheckedState.partOf: {
                        parentState= state;

                        break;
                    }
                }

                this._innerSetChcekedState(parent.id, parentState, silent);

                parent= this.getNode(parent._innerParentId);
            }
        },

        checkRecursiveChildren: function(node, state, silent){
            if(node.nodes && node.nodes.length>0){
                for(var i=0; i<node.nodes.length; i++){
                    var child= node.nodes[i];
                    this._innerSetChcekedState(child.id, state, silent);
                    this.checkRecursiveChildren(child, state, silent);
                }
            }
        },

        checkNode: function (nodeIds, silent) {
            for(var i=0; i<nodeIds.length; i++){
                this.setCheckedState(nodeIds[i], 'checked', silent);
            }
        },

        uncheckNode: function (nodeIds, silent) {
            for(var i=0; i<nodeIds.length; i++){
                this.setCheckedState(nodeIds[i], 'unchecked', silent);
            }
        },

        toggleCheckedState: function (nodeId, silent) {
            var jqNode= this.elements.getNode(nodeId);
            var jqCheck= jqNode.find('.check-icon');

            // 是否未选中
            var state= hasClasses(jqCheck, this.settings.uncheckedIcon);

            // 在选中和部分选中的情况下切换为不选中
            // this.setCheckedState(nodeId, !state, silent);
            this.setCheckedState(nodeId, state ? 'checked' : 'unchecked', silent);
        },

        toggleNodeChecked: function (nodeIds, silent) {
            for(var i=0; i<nodeIds.length; i++){
                this.toggleCheckedState(nodeIds[i], silent);
            }
        },

        checkAll: function (silent) {
            var checkedNodes= this.elements.getCheckedNodes(true);
            var jqCheck= checkedNodes.find('.check-icon');

            checkedNodes.addClass('node-checked');
            jqCheck.removeClass(this.settings.uncheckedIcon).addClass(this.settings.checkedIcon);

            if (!silent) {
                var context= this;
                checkedNodes.each(function(){
                    var nodeId= $(this).data('id');
                    context.elements.original.trigger('nodeChecked', nodeId);
                });
            }
        },

        uncheckAll: function (silent) {
            var uncheckedNodes= this.elements.getCheckedNodes(false);
            var jqCheck= uncheckedNodes.find('.check-icon');

            uncheckedNodes.removeClass('node-checked');            
            jqCheck.removeClass(this.settings.checkedIcon).addClass(this.settings.uncheckedIcon);

            if (!silent) {
                var context= this;
                uncheckedNodes.each(function(){
                    var nodeId= $(this).data('id');
                    context.elements.original.trigger('nodeUnchecked', nodeId);
                });
            }
        },

        // -------------------------------------------------------------------
        // 启用 / 禁用
        // -------------------------------------------------------------------

        setDisabledState: function (nodeId, state, silent, ignoreChildren) {
            var jqNode= this.elements.getNode(nodeId);

            if (state) {
                jqNode.addClass('node-disabled');

                // Disable all other states
                this.setExpandedState(nodeId, false, silent, ignoreChildren);
                this.setSelectedState(nodeId, false, silent);
                this.setCheckedState(nodeId, 'unchecked', silent);

                if (!silent) {
                    this.elements.original.trigger('nodeDisabled', nodeId);
                }
            }
            else {
                jqNode.removeClass('node-disabled');

                if (!silent) {
                    this.elements.original.trigger('nodeEnabled', nodeId);
                }
            }
        },

        enableNode: function (nodeIds, silent) {
            for(var i=0; i<nodeIds.length; i++){
                this.setDisabledState(nodeIds[i], false, silent);
            }
        },

        disableNode: function (nodeIds, silent) {
            for(var i=0; i<nodeIds.length; i++){
                this.setDisabledState(nodeIds[i], true, silent);
            }
        },

        toggleDisabledState: function (nodeId, silent) {
            var jqNode= this.elements.getNode(nodeId);
            var state= jqNode.hasClass('node-disabled');

            this.setDisabledState(nodeId, !state, silent);
        },

        toggleNodeDisabled: function (nodeIds, silent) {
            for(var i=0; i<nodeIds.length; i++){
                this.toggleDisabledState(nodeIds[i], silent);
            }
        },

        disableAll: function (silent, ignoreChildren) {            
            var enabledNodes= this.elements.getDisabledNodes(true);
            enabledNodes.addClass('node-disabled');

            var context= this;
            enabledNodes.each(function(){
                var nodeId= $(this).data('id');

                // Disable all other states
                context.setExpandedState(nodeId, false, silent, ignoreChildren);
                context.setSelectedState(nodeId, false, silent);
                context.setCheckedState(nodeId, 'unchecked', silent);

                if (!silent) {
                    context.elements.original.trigger('nodeDisabled', nodeId);
                }
            });
        },

        enableAll: function (silent, ignoreChildren) {
            var disabledNodes= this.elements.getDisabledNodes(false);
            disabledNodes.removeClass('node-disabled');

            var context= this;
            disabledNodes.each(function(){
                var nodeId= $(this).data('id');

                // // Enable all other states
                // context.setExpandedState(nodeId, true, silent, ignoreChildren);
                // context.setSelectedState(nodeId, true, silent);
                // context.setCheckedState(nodeId, 'checked', silent);

                if (!silent) {
                    context.elements.original.trigger('nodeEnabled', nodeId);
                }
            });            
        },

        getNode: function(nodeId){
            var nodeIndex= this.idIndexMap['id_'+nodeId];
            return this.data[nodeIndex];
        },

        revealNode: function (nodeIds, options) {
            // this.forEachIdentifier(identifiers, options, $.proxy(function (node, options) {
            //     var parentNode = this.getParent(node);
            //     while (parentNode) {
            //         this.setExpandedState(parentNode, true, options);
            //         parentNode = this.getParent(parentNode);
            //     };
            // }, this));

            for(var i=0; i<nodeIds.length; i++){
                var nodeId= nodeIds[i];
                var jqNode= this.elements.getNode(nodeId);
                var path= jqNode.data('path');
                var arrPath= path.split('|');
                for(var j=1; j<arrPath.length-1; j++){
                    this.setExpandedState(arrPath[j], true, options);
                }
            }
        },

        search: function (pattern, options) {
            var searchOptions = {
                ignoreCase: true,
                exactMatch: false,
                revealResults: true
            };

            options = $.extend({}, searchOptions, options);

            this.clearSearch();

            var results = [];
            if (pattern && pattern.length > 0) {

                if (options.exactMatch) {
                    pattern = '^' + pattern + '$';
                }

                var modifier = 'g';
                if (options.ignoreCase) {
                    modifier += 'i';
                }

                results = this.findNodes(pattern, modifier);
            }

            if (options.revealResults) {
                this.revealNode(results);
            }

            this.elements.original.trigger('searchComplete', $.extend(true, {}, results));

            return results;
        },

        clearSearch: function () {
            var searchResults= this.elements.getSearchResultNodes();
            searchResults.removeClass('search-result');
            
            this.elements.original.trigger('searchCleared');    // , $.extend(true, {}, results)
        },

        findNodes: function (pattern, modifier) {   // , attribute
            modifier = modifier || 'g';
            // attribute = attribute || 'text';

            var allNodes= this.elements.getAllNodes();

            var results= [];
            for(var i=0; i<allNodes.length; i++){
                var jqNode= $(allNodes[i]);
                var val = jqNode.text();
                var isMatched= val.match(new RegExp(pattern, modifier));
                if(isMatched){
                    jqNode.addClass('search-result');
                    results.push(jqNode.data('id'));
                }
            }

            return results;
        },

        destroy: function () {
            this.container.empty();
            this.container = null;
            this.unsubscribeEvents();
        },
        // 取消事件监听
        unbindEvents: function () {
            this.elements.original.off('click');
            this.elements.original.off('nodeChecked');
            this.elements.original.off('nodeCollapsed');
            this.elements.original.off('nodeDisabled');
            this.elements.original.off('nodeEnabled');
            this.elements.original.off('nodeExpanded');
            this.elements.original.off('nodeSelected');
            this.elements.original.off('nodeUnchecked');
            this.elements.original.off('nodeUnselected');
            this.elements.original.off('searchComplete');
            this.elements.original.off('searchCleared');
        },
        // 监听事件
        bindEvents: function () {
            this.unbindEvents();

            this.elements.original.on('click', $.proxy(this.clickHandler, this));
            // 节点勾选
            this.elements.original.on('nodeChecked', this.settings.onNodeChecked);
            // 节点收起
            this.elements.original.on('nodeCollapsed', this.settings.onNodeCollapsed);
            // 节点禁用
            this.elements.original.on('nodeDisabled', this.settings.onNodeDisabled);
            // 节点启用
            this.elements.original.on('nodeEnabled', this.settings.onNodeEnabled);
            // 节点展开
            this.elements.original.on('nodeExpanded', this.settings.onNodeExpanded);
            // 节点选中
            this.elements.original.on('nodeSelected', this.settings.onNodeSelected);
            // 节点取消勾选
            this.elements.original.on('nodeUnchecked', this.settings.onNodeUnchecked);
            // 节点取消选中
            this.elements.original.on('nodeUnselected', this.settings.onNodeUnselected);
            // 搜索完成
            this.elements.original.on('searchComplete', this.settings.onSearchComplete);
            // 搜索结果清除
            this.elements.original.on('searchCleared', this.settings.onSearchCleared);
        }
    });
});




        // API
        
        // /**
        //     Returns an array of selected nodes.
        //     @returns {Array} nodes - Selected nodes
        // */
        // getSelected: function () {
        //     return this.findNodes('true', 'g', 'state.selected');
        // },

        // /**
        //     Returns an array of unselected nodes.
        //     @returns {Array} nodes - Unselected nodes
        // */
        // getUnselected: function () {
        //     return this.findNodes('false', 'g', 'state.selected');
        // },

        // /**
        //     Returns an array of expanded nodes.
        //     @returns {Array} nodes - Expanded nodes
        // */
        // getExpanded: function () {
        //     return this.findNodes('true', 'g', 'state.expanded');
        // },

        // /**
        //     Returns an array of collapsed nodes.
        //     @returns {Array} nodes - Collapsed nodes
        // */
        // getCollapsed: function () {
        //     return this.findNodes('false', 'g', 'state.expanded');
        // },

        // /**
        //     Returns an array of checked nodes.
        //     @returns {Array} nodes - Checked nodes
        // */
        // getChecked: function () {
        //     return this.findNodes('true', 'g', 'state.checked');
        // },

        // /**
        //     Returns an array of unchecked nodes.
        //     @returns {Array} nodes - Unchecked nodes
        // */
        // getUnchecked: function () {
        //     return this.findNodes('false', 'g', 'state.checked');
        // },

        // /**
        //     Returns an array of disabled nodes.
        //     @returns {Array} nodes - Disabled nodes
        // */
        // getDisabled: function () {
        //     return this.findNodes('true', 'g', 'state.disabled');
        // },

        // /**
        //     Returns an array of enabled nodes.
        //     @returns {Array} nodes - Enabled nodes
        // */
        // getEnabled: function () {
        //     return this.findNodes('false', 'g', 'state.disabled');
        // },



            // var arrNodesResult= $.grep(allNodes, function (element) {
            //     var jqNode= $(element);
            //     var val = jqNode.text();
            //     var isMatched= val.match(new RegExp(pattern, modifier));
            //     return isMatched;
            // });




        // buildTree: function (nodes, level) {
        //     if (!nodes) return;
        //     level += 1;

        //     for(var i=0; i<nodes.length; i++){
        //         var node=nodes[i];

        //         var item= this.buildItem(node, level);

        //         // Add item to the tree
        //         this.container.append(item);

        //         // Recursively add child ndoes
        //         if (node.nodes) {   // && !node.state.disabled && node.state.expanded TODO:移除原有expanded机制，改为显示/隐藏模式
        //             this.buildTree(node.nodes, level);
        //         }
        //     }
        // },
        
        // buildItem: function(node, level){
        //     // indent
        //     var indent= '';
        //     for (var j = 0; j < (level - 1); j++) {
        //         indent+='<span class="indent"></span>';
        //     }

        //     // icon
        //     // var cssClassIcon= 'icon';
        //     // if (node.nodes) {
        //     //     cssClassIcon += node.state.expanded ? ' expand-icon '+this.settings.collapseIcon : ' expand-icon '+this.settings.expandIcon;
        //     // }
        //     // else {
        //     //     cssClassIcon += ' ' + this.settings.emptyIcon;
        //     // }
        //     var cssClassIcon= 'icon';
        //     if (node.nodes && node.nodes.length > 0) {
        //         cssClassIcon += level < this.settings.levels ? ' expand-icon '+this.settings.collapseIcon : ' expand-icon '+this.settings.expandIcon;
        //     }
        //     else {
        //         cssClassIcon += ' ' + this.settings.emptyIcon;
        //     }

        //     var icon= '<span class="'+cssClassIcon+'"></span>';

        //     // node icon
        //     var nodeIcon= '';
        //     if (this.settings.showIcon) {
        //         var cssClassNodeIcon= 'icon node-icon ';
        //         // if (node.state.selected) {
        //         //     cssClassNodeIcon += (node.selectedIcon || this.settings.selectedIcon || node.icon || this.settings.nodeIcon);
        //         // }
        //         // else{
        //         //     cssClassNodeIcon += (node.icon || this.settings.nodeIcon);
        //         // }
        //         cssClassNodeIcon += (node.icon || this.settings.nodeIcon);
        //         nodeIcon= '<span class="'+cssClassNodeIcon+'"></span>'; // icon
        //     }

        //     // Add check / unchecked icon
        //     var check= '';
        //     if (this.settings.showCheckbox) {
        //         var cssClassCheck= 'icon check-icon ';
        //         // if (node.state.checked) {
        //         //     cssClassCheck += this.settings.checkedIcon; 
        //         // }
        //         // else {
        //         //     cssClassCheck += this.settings.uncheckedIcon;
        //         // }
        //         cssClassCheck += this.settings.uncheckedIcon;
        //         check= '<span class="'+ cssClassCheck +'"></span>';
        //     }

        //     // tags as badges
        //     var badge= '';
        //     if (this.settings.showTags && node.tags) {
        //         for(var k=0; k<node.tags.length; k++){
        //             var tag=node.tags[k];
        //             badge += '<span class="badge">'+tag+'</span>';  // badge
        //         }
        //     }

        //     // item
        //     var cssClass= 'list-group-item';
        //     // cssClass += node.state.checked ? ' node-checked' : '';
        //     // cssClass += node.state.disabled ? ' node-disabled' : '';
        //     // cssClass += node.state.selected ? ' node-selected' : '';
        //     // cssClass += node.searchResult ? ' search-result' : '';
        //     var item= ''+
        //         '<li '+
        //         '   class="' + cssClass + '" '+
        //         (this.settings.levels && level>this.settings.levels ? 
        //         '   style="display: none;"' : '')+  // 隐藏应该折叠的nodes
        //         (this.settings.enableTitle ? 
        //         '   title="'+node.text+'"' : '')+
        //         '   data-id="'+node.id+'"'+
        //         '   data-level="'+level+'"'+
        //         '   data-path="'+node._innerPath+'">'+
        //         indent +
        //         icon +
        //         nodeIcon +
        //         check +
        //         (this.settings.enableLinks ? 
        //         '   <a href="'+node.href+'" style="color:inherit;">'+node.text+'</a>' : node.text) +
        //         badge +
        //         '</li>';

        //     return item;
        // },



        // setCheckedState: function(nodeId, state, silent){
        //     var jqNode= this.elements.getNode(nodeId);
        //     var jqCheck= jqNode.find('.check-icon');

        //     if (state) {   
        //         jqNode.addClass('node-checked');
        //         jqCheck.removeClass(this.settings.uncheckedIcon).addClass(this.settings.checkedIcon);

        //         if (!silent) {
        //             // this.elements.original.trigger('nodeChecked', $.extend(true, {}, node));
        //             this.elements.original.trigger('nodeChecked', nodeId);
        //         }
        //     }
        //     else {
        //         jqNode.removeClass('node-checked');
        //         jqCheck.removeClass(this.settings.checkedIcon).addClass(this.settings.uncheckedIcon);

        //         if (!silent) {
        //             this.elements.original.trigger('nodeUnchecked', nodeId);
        //         }
        //     }
        // }