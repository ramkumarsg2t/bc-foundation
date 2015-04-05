var doc = document,
    html = $('html'),
    body = $(doc.body),
    win = window,
    bcmodules = body.find('#bcmodules'),
    appPath = '_System/apps/bcpie-layouts/',
    settingsPath = appPath + 'scripts/settings.json',
    oauthTokenAPI = "https://framework-bcpie.rhcloud.com/api/git-token";

$(function() {

    var appScripts = {
        ui:{
            showLoading: function(){
                body.find("#pagecontainer").addClass('hide');
                html.addClass('loading');
            },
            hideLoading: function(){
                body.find("#pagecontainer").removeClass('hide');
                html.removeClass('loading');
            }
        },
        updateBCPie: function() {
            var pagecontent = body.find("#pagecontent"),
                app = $.parseJSON(bc.api.file.get(settingsPath)),
                folderContainer = body.find('#folderContainer'),
                frameworkSelect = body.find('[name="frameworks"]'),
                folderSelectRadio = body.find('[name="folderSelect"]'),
                foldersListContainer = body.find('#foldersListContainer'),
                registry, loadingTimeout, repoStructure;

            function initializeFrameworksAvailable() {
                $.ajax({
                    type: "GET",
                    url: oauthTokenAPI,
                    success: function(data) {
                        $.setGithubSetOAuthToken(data.token);
                        $.getGithubFileByFilePath(app.registry.username, app.registry.repo, app.registry.filename, function(contents) {
                            registry = JSON.parse(contents);
                            var selectHtml = "";
                            console.log(registry);
                            for (i = 0; i < registry.repos.length; i++) {
                                frameworkSelect.append('<option value="' + registry.repos[i].name + '" data-username="' + registry.repos[i].username + '"  data-repository="' + registry.repos[i].repository + '" >' + registry.repos[i].name + " " + registry.repos[i].version + '</option>');
                            }
                        });
                        appScripts.ui.hideLoading();
                    }
                });
            }

            function bindFrameworkSelectEvent() {
                frameworkSelect.on("change", function() {
                    appScripts.ui.showLoading();
                    if (typeof $(this).val() !== "undefined" && $(this).val() !== "") {
                        var repo = frameworkSelect.find('option:selected').data('repository'),
                            username = frameworkSelect.find('option:selected').data('username');
                        $.getGithubFileByFilePath(username, repo, "repo.json", function(contents) {
                            console.log(contents);
                            repoStructure = JSON.parse(contents);
                            //load repos files and folders
							treeData = [];		
                            treeData = parseTreeData(repoStructure);
                            loadDynaTree(treeData);
                            folderContainer.removeClass('hide');
                            appScripts.ui.hideLoading();
                        });
                    } else {
                        folderContainer.addClass('hide');
                        appScripts.ui.hideLoading();
                    }
                });
            }

            function parseTreeData(repoStructure){
                for (var key in repoStructure.structure) {
                    var layoutArr = repoStructure.structure[key];
                    for(var i=0 ; i<layoutArr.length; i++) {
                        var firstChildObj = {
                            'title'        : layoutArr[i].name,
                            'isFolder'     : ((layoutArr[i].type == "folder") ? true : false),
                            'key'          : key + '/' + layoutArr[i].name
                        };
                        firstChildObj.children = [];
                        var subFolder = layoutArr[i]['files'];
                        if(layoutArr[i].hasOwnProperty('files')){
                            for(var j=0; j<subFolder.length; j++) {
                                var secondChildObj = {
                                    'title'        : subFolder[j].name,
                                    'key'          : key + '/' + layoutArr[i].name + '/' +subFolder[j].name,
                                    'isFolder'     : ((subFolder[j].type == "folder") ? true : false),
                                }
                                
                                if(subFolder[j].type == "folder") {
                                    secondChildObj.children = [];
                                    var subSubFolder = subFolder[j]['files'];
                                    for(var k=0; k<subSubFolder.length; k++) {
                                        var thirdChildObj = {
                                            'title'    : subSubFolder[k].name,
                                            'key'    : key + '/' + layoutArr[i].name + '/' +subFolder[j].name + '/' +subSubFolder[k].name
                                        }
                                        secondChildObj.children.push(thirdChildObj);
                                    }
                                }
                                firstChildObj.children.push(secondChildObj);
                            }
                        }
                        treeData.push(firstChildObj);
                    }
                }
                return treeData;
            }

            function loadDynaTree(treeData){
                var dynatreeInit = true;
                var layoutsData = $.grep(treeData, function(e){ 
                     return e.key.indexOf('Layouts/') > -1; 
                });
                var coreData = $.grep(treeData, function(e){ 
                     return e.key.indexOf('core/') > -1; 
                });
                var appUpdateData  = $.grep(treeData,function(e){
                    return e.key.indexOf('bcpieLayoutsApp/') > -1;
                });

                try{ body.find("#foldertree").dynatree("getTree"); } catch(e){ dynatreeInit = false; }
                if(!dynatreeInit){
                    body.find("#foldertree").dynatree({
                        checkbox: true,
                        selectMode: 3,
                        children: layoutsData,
                        onSelect: function(select, node) {
                            // Get a list of all selected nodes, and convert to a key array:
                            var selKeys = $.map(node.tree.getSelectedNodes(), function(node) {
                                return node.data.key;
                            });
                            $("#echoSelection3").text(selKeys.join(", "));
                            // Get a list of all selected TOP nodes
                            var selRootNodes = node.tree.getSelectedNodes(true);
                            // ... and convert to a key array:
                            var selRootKeys = $.map(selRootNodes, function(node) {
                                return node.data.key;
                            });
                            $("#echoSelectionRootKeys3").text(selRootKeys.join(", "));
                            $("#echoSelectionRoots3").text(selRootNodes.join(", "));
                        },
                        onDblClick: function(node, event) {
                            node.toggleSelect();
                        },
                        onKeydown: function(node, event) {
                            if (event.which == 32) {
                                node.toggleSelect();
                                return false;
                            }
                        },
                        cookieId: "dynatree-Cb3",
                        idPrefix: "dynatree-Cb3-"
                    });
                    //Initialize core tree
                    body.find("#coreTree").dynatree({
                        checkbox: true,
                        selectMode: 3,
                        children: coreData,
                        onSelect: function(select, node) {
                            // Get a list of all selected nodes, and convert to a key array:
                            var selKeys = $.map(node.tree.getSelectedNodes(), function(node) {
                                return node.data.key;
                            });
                            $("#echoSelection3").text(selKeys.join(", "));
                            // Get a list of all selected TOP nodes
                            var selRootNodes = node.tree.getSelectedNodes(true);
                            // ... and convert to a key array:
                            var selRootKeys = $.map(selRootNodes, function(node) {
                                return node.data.key;
                            });
                            $("#echoSelectionRootKeys3").text(selRootKeys.join(", "));
                            $("#echoSelectionRoots3").text(selRootNodes.join(", "));
                        },
                        onDblClick: function(node, event) {
                            node.toggleSelect();
                        },
                        onKeydown: function(node, event) {
                            if (event.which == 32) {
                                node.toggleSelect();
                                return false;
                            }
                        },
                        cookieId: "dynatree-Cb3",
                        idPrefix: "dynatree-Cb3-"
                    });

                    //Initialize app update tree
                    body.find("#updateTree").dynatree({
                        checkbox: true,
                        selectMode: 3,
                        children: appUpdateData,
                        onSelect: function(select, node) {
                            // Get a list of all selected nodes, and convert to a key array:
                            var selKeys = $.map(node.tree.getSelectedNodes(), function(node) {
                                return node.data.key;
                            });
                            $("#echoSelection3").text(selKeys.join(", "));
                            // Get a list of all selected TOP nodes
                            var selRootNodes = node.tree.getSelectedNodes(true);
                            // ... and convert to a key array:
                            var selRootKeys = $.map(selRootNodes, function(node) {
                                return node.data.key;
                            });
                            $("#echoSelectionRootKeys3").text(selRootKeys.join(", "));
                            $("#echoSelectionRoots3").text(selRootNodes.join(", "));
                        },
                        onDblClick: function(node, event) {
                            node.toggleSelect();
                        },
                        onKeydown: function(node, event) {
                            if (event.which == 32) {
                                node.toggleSelect();
                                return false;
                            }
                        },
                        cookieId: "dynatree-Cb3",
                        idPrefix: "dynatree-Cb3-"
                    });
                    $('#updateTree').dynatree("getRoot").visit(function(node) {
                        node.select(true);
                    });

                } else{
                    var root = body.find("#foldertree").dynatree("getRoot");
                    root.removeChildren();
                    root.addChild(treeData);
                }
            }

            function bindRadioCheckEvent() {
                folderSelectRadio.on('change', function() {
                    if ($(this).val() === "1") {
                        console.log('select all');
                        foldersListContainer.find('ul li input').prop('checked', true);
                    } else {
                        console.log('un select all');
                        foldersListContainer.find('ul li input').prop('checked', false);
                    }
                });
            }

            function populateFolders() {
                var folderHtml = "";
                for (i = 0; i < app.folders.length; i++) {
                    var folder = app.folders[i];
                    folderHtml = folderHtml + '<h4>' + folder.rootfolder + '</h4>';
                    folderHtml = folderHtml + '<ul class="small-block-grid-2 medium-block-grid-3 large-block-grid-4">';
                    for (j = 0; j < folder.subfolders.length; j++) {
                        var dateObj = new Date(folder.subfolders[j].lastUpdated),
                            dateString = dateObj.getDate() + '/' + (dateObj.getMonth() + 1) + '/' + dateObj.getFullYear();
                        folderHtml = folderHtml + '<li><input type="checkbox" name="folders" value="' + folder.rootfolder + '/' + folder.subfolders[j].name + '" data-rootfolder="' + i + '"  data-subfolder="' + j + '"/><span data-tooltip aria-haspopup="true" class="has-tip" data-options="show_on:large" title="' + "Last Updated on " + dateObj + '">' + folder.subfolders[j].name + '</span></li>';

                    }

                    folderHtml = folderHtml + '<li><input type="checkbox" name="folders" value="Layouts/Test" data-rootfolder="0" data-subfolder="17">';
                    folderHtml = folderHtml + '<span data-tooltip="" aria-haspopup="true" class="has-tip" data-options="show_on:large" title="Last Updated on Wed Feb 25 2015 17:01:06 GMT+0530 (India Standard Time)">WebApps</span>';
                    folderHtml = folderHtml + '<ul ><li><input type="checkbox" name="folders" value="Layouts/Test/1"/>1</li>';
                    folderHtml = folderHtml + '<li><input type="checkbox" name="folders" value="Layouts/Test/2"/>2</li>';
                    folderHtml = folderHtml + '<ul>';
                    folderHtml = folderHtml + '</li>';

                    folderHtml = folderHtml + '</ul>';
                }
                foldersListContainer.append(folderHtml);
            }

            initializeFrameworksAvailable();
            bindFrameworkSelectEvent();
            bindRadioCheckEvent();

            body.on('click', '[name="Update"]', function() {
                appScripts.ui.showLoading();
                var repo = frameworkSelect.find('option:selected').data('repository'),
                    username = frameworkSelect.find('option:selected').data('username'),
                    checkedFiles = [],activeTab = $('#tabs').tabs('option','active');
                if(activeTab == 0)
                    checkedFiles = $.map($("#foldertree").dynatree("getSelectedNodes"), function(node) { if(!node.childList){ return node.data.key } });
                else if(activeTab == 1)
                    checkedFiles = $.map($("#coreTree").dynatree("getSelectedNodes"), function(node) { if(!node.childList){ return node.data.key } });
                
                for (i = 0; i < checkedFiles.length; i++) {
                    var filePath = checkedFiles[i];
                    var targetFilePath = filePath;
                    if(activeTab == 1) targetFilePath = targetFilePath.replace('core/','');
                    $.getGithubFileByFilePath(username, repo, filePath, function(fileContents) {
                        bc.api.file.save(targetFilePath, fileContents).done(function() {
                            window.clearTimeout();
                            $.sticky("<b>Updated Successfully</b><br>" + targetFilePath, {
                                closeImage: "/_system/apps/bcpie-layouts/images/close.png"
                            })
                        });
                    });
                }
                setTimeout(function() {
                    bc.api.file.save(settingsPath, JSON.stringify(app));
                    appScripts.ui.hideLoading();
                    //clear selection
                    body.find("#foldertree").dynatree("getRoot").visit(function(node) {
                        node.select(false);
                    });
                    body.find("#coreTree").dynatree("getRoot").visit(function(node) {
                        node.select(false);
                    });
                }, 3000);
            });

            body.find(".btnToggleSelect").on('click', function() {
                $(this).parents('.listContainer').find('.tree').dynatree("getRoot").visit(function(node) {
                    node.toggleSelect();
                });
                return false;
            });
            body.find(".btnDeselectAll").on('click', function() {
                $(this).parents('.listContainer').find('.tree').dynatree("getRoot").visit(function(node) {
                    node.select(false);
                });
                return false;
            });
            body.find(".btnSelectAll").on('click', function() {
                $(this).parents('.listContainer').find('.tree').dynatree("getRoot").visit(function(node) {
                    node.select(true);
                });
                return false;
            });

        },
        checkAppUpdate : function(){
            $('#divUpdate').removeClass('hide');
            
            $('input[name="btnUpdateApp"]').on('click',function(){
                appScripts.ui.showLoading();
                var repo = frameworkSelect.find('option:selected').data('repository'),
                    username = frameworkSelect.find('option:selected').data('username'),
                    checkedFiles = [];
                    checkedFiles = $.map($("#updateTree").dynatree("getSelectedNodes"), function(node) { if(!node.childList){ return node.data.key } });
                
                for (i = 0; i < checkedFiles.length; i++) {
                    var filePath = checkedFiles[i];
                    var targetFilePath = filePath;
                    if(activeTab == 1) targetFilePath = targetFilePath.replace('core/','');
                    $.getGithubFileByFilePath(username, repo, filePath, function(fileContents) {
                        bc.api.file.save(targetFilePath, fileContents).done(function() {
                            window.clearTimeout();
                            $.sticky("<b>App Updated Successfully</b>", {
                                closeImage: "/_system/apps/bcpie-layouts/images/close.png"
                            });
                        });
                    });
                }
                setTimeout(function() {
                    bc.api.file.save(settingsPath, JSON.stringify(app));
                    appScripts.ui.hideLoading();
                }, 3000);
            });
        }
    };
    appScripts.updateBCPie();
    appScripts.checkAppUpdate();
    $("#tabs").tabs();
});
