﻿(function ($) {
    $.widget('pic.pnlCfgGeneral', {
        options: { cfg: {} },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].checkChanged = function () { return self.checkChanged(); }
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            var tabs = $('<div class="picTabPanel"></div>');
            el.addClass('config-general');
            $.getLocalService('/config/options/general', null, function (data, status, xhr) {
                console.log(data);
                var outer = $('<div></div>').appendTo(el).addClass('control-panel');
                var head = $('<div></div>').appendTo(outer).addClass('pnl-settings-header').addClass('control-panel-title');
                $('<span></span>').appendTo(head).addClass('header-text').text('Settings');
                var settings = $('<div></div>').appendTo(outer).addClass('pnl-board-settings');

                var line = $('<div></div>').appendTo(settings);
                $('<div></div>').appendTo(line).pickList({
                    required: true,
                    bindColumn: 0, displayColumn: 1, labelText: 'Board', binding: 'controllerType',
                    columns: [{ hidden: true, binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Controller Type', style: { width: '297px', whiteSpace: 'nowrap' } }],
                    items: data.controllerTypes, inputAttrs: { style: { width: '10rem' } }, labelAttrs: { style: { width: '4rem' } }
                }).
                    on('selchanged', function (evt) {
                        console.log(evt.newItem);
                        if (makeBool(evt.newItem.spi0)) el.find('div#cbSpi0').show();
                        else {
                            el.find('div#cbSpi0').hide();
                            el.find('div#cbSpi0')[0].val(false);
                        }
                        if (makeBool(evt.newItem.spi1)) el.find('div#cbSpi1').show();
                        else {
                            el.find('div#cbSpi1').hide();
                            el.find('div#cbSpi1')[0].val(false);
                        }
                        if (makeBool(evt.newItem.i2c)) el.find('div#cbI2c').show();
                        else {
                            el.find('div#cbI2c').hide();
                            el.find('div#cbI2c')[0].val(false);
                        }
                    });
                var grpInterfaces = $('<fieldset></fieldset>').appendTo(settings).attr('id', 'grpInterfaces');
                $('<legend></legend>').appendTo(grpInterfaces).text('SPI - Interface');
                line = $('<div></div>').appendTo(grpInterfaces);
                $('<div></div>').appendTo(line).checkbox({ id: 'cbSpi0', labelText: 'SPI0 - Serial Peripheral Interface', binding: 'spi0.isActive' }).hide()
                    .on('changed', function (evt) { $(evt.target).parents('div#tabsMain')[0].showTab('tabSpi0', evt.newVal); });
                line = $('<div></div>').appendTo(grpInterfaces);
                $('<div></div>').appendTo(line).checkbox({ id: 'cbSpi1', labelText: 'SPI1 - Serial Peripheral Interface', binding: 'spi1.isActive' }).hide()
                    .on('changed', function (evt) { $(evt.target).parents('div#tabsMain')[0].showTab('tabSpi1', evt.newVal); });
                line = $('<div></div>').appendTo(grpInterfaces);
                //$('<div></div>').appendTo(line).checkbox({ id: 'cbI2c', labelText: 'I<span style="vertical-align:super;font-size:.7em;display:inline-block;margin-top:-20px;">2</span>C - Inter-Integrated Circuit', binding: 'i2c.isActive' }).hide()
                //    .on('changed', function (evt) { $(evt.target).parents('div#tabsMain')[0].showTab('tabI2c', evt.newVal); });
                grpInterfaces = $('<fieldset></fieldset>').appendTo(settings).attr('id', 'grpInterfaces');
                $('<legend></legend>').appendTo(grpInterfaces).html('I<span style="vertical-align:super;font-size:.7em;display:inline-block;margin-top:-20px;">2</span>C - Interface');
                line = $('<div></div>').appendTo(grpInterfaces);
                $('<div></div>').appendTo(grpInterfaces).pnlI2cBuses();


                $('<hr></hr>').appendTo(outer);
                var conns = $('<div></div>').appendTo(outer).pnlConnections();
                var btnPnl = $('<div class="btn-panel"></div>').appendTo(outer);
                $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Reset Server', icon: '<i class="fas fa-power-off"></i>' })
                    .on('click', function (evt) {
                        var cont = dataBinder.fromElement(el);
                        $.putLocalService('/config/reset', cont, 'Resetting the Server Settings...', function (controller, status, xhr) {
                            console.log(controller);
                        });
                    });


                $('<div></div>').appendTo(btnPnl).actionButton({ text: 'Save Settings', icon: '<i class="fas fa-save"></i>' })
                    .on('click', function (evt) { self.saveSettings(); });
                o.controllerTypes = data.controllerTypes;
                self.dataBind(data.controller);
                conns[0].dataBind(data.controller.connections);
            });
        },
        dataBind: function (data) {
            var self = this, o = self.options, el = self.element;
            var settings = el.find('div.pnl-board-settings:first');
            _controller().boardType(o.controllerTypes.find(elem => elem.name === data.controllerType));
            el.find('div.crud-list#crudI2cBuses').each(function () {
                this.clear();
                for (var i = 0; i < data.i2c.buses.length; i++) {
                    var bus = data.i2c.buses[i];
                    this.addRow(bus);
                }
            });
            dataBinder.bind(settings, data);
            o.controller = data;
        },
        saveSettings: function () {
            var self = this, o = self.options, el = self.element;
            var settings = el.find('div.pnl-board-settings:first');
            var cont = dataBinder.fromElement(settings);
            // Send this off to the service.
            $.putLocalService('/config/general', cont, 'Saving Settings...', function (controller, status, xhr) { self.dataBind(controller); });
        },
        checkChanged: function (newTabId) {
            var self = this, o = self.options, el = self.element;
            var bChanged = false;
            var settings = el.find('div.pnl-board-settings:first');
            var cont = dataBinder.fromElement(settings);
            if (o.controller.controllerType !== cont.controllerType ||
                cont.spi0.isActive !== o.controller.spi0.isActive ||
                cont.spi1.isActive !== o.controller.spi1.isActive) bChanged = true;
            if (bChanged) {
                var dlg = $.pic.modalDialog.createDialog('dlgConfirmChanges', {
                    width: '447px',
                    height: 'auto',
                    title: 'Board Definition Changed',
                    position: { my: "center top", at: "center top", of: window },
                    buttons: [
                        {
                            text: 'Save', icon: '<i class="fas fa-save"></i>',
                            click: function (evt) {
                                $.pic.modalDialog.closeDialog(this);
                                self.saveSettings();
                            }
                        },
                        {
                            text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                            click: function () { $.pic.modalDialog.closeDialog(this); }
                        }
                    ]
                });
                $('<div></div>').appendTo(dlg).text('The board definition has changed do you want to save your changes?  You must either save your changes or press cancel to continue.');
            }
            return !bChanged;
        }
    });
    $.widget('pic.pnlConnections', {
        options: { cfg: {} },
        // The connections need to be thinks like
        // 1. Socket
        // 2. MQTT
        // 3. Http WebHook
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (conns) { self.dataBind(conns); }
        },
        _reloadConnections() {
            var self = this, o = self.options, el = self.element;
            $.getLocalService('/config/options/connections', null, function (conns, status, xhr) {
                console.log(conns);
                self.dataBind(conns.connections);
            });
        },
        _findServer: function (pnl, server) {
            var self = this, o = self.options, el = self.element;
            var srv = server;
            var dlg = $.pic.modalDialog.createDialog('dlgFindServers', {
                message: 'Searching for Servers',
                width: '400px',
                height: 'auto',
                title: 'Find Server',
                buttons: [{
                    text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                    click: function () { $.pic.modalDialog.closeDialog(this); }
                }]
            }).on('initdialog', function (evt) {
                console.log('open triggered');
                $.searchLocalService('/config/findServer', server, function (servers, status, xhr) {
                    console.log(server);
                    console.log(servers);
                    if (servers.length > 0) {
                        searchStatus.text(servers.length + ' Running ' + server.desc + ' server(s) found.');
                        for (var i = 0; i < servers.length; i++) {
                            var srv = servers[i];
                            var divSelection = $('<div></div>').addClass('picButton').addClass('server').addClass('btn').css({ maxWidth: '227px', height: '97px', verticalAlign: 'middle' }).appendTo(line);
                            if (server.desc.startsWith('nodejs'))
                                $('<div></div>').addClass('body-text').css({ textAlign: 'center' }).appendTo(divSelection).append('<i class="fab fa-node-js" style="font-size:30pt;color:green;vertical-align:middle;"></i>').append('<span style="vertical-align:middle;"> ' + server.desc + '</span>');
                            else
                                $('<div></div>').addClass('body-text').css({ textAlign: 'center' }).appendTo(divSelection).append('<i class="fas fa-server" style="font-size:30pt;color:lightseagreen;vertical-align:middle;"></i>').append('<span style="vertical-align:middle;"> ' + server.desc + '</span>');
                            $('<div></div>').css({ textAlign: 'center', marginLeft: '1rem', marginRight: '1rem' }).appendTo(divSelection).text(srv.origin);
                            divSelection.data('server');
                            divSelection.on('click', function (e) {
                                console.log(srv);
                                pnl.find('div[data-bind="ipAddress"]').each(function () { this.val(srv.hostname); });
                                pnl.find('div[data-bind="protocol"]').each(function () { this.val(srv.protocol) });
                                pnl.find('div[data-bind="port"]').each(function () { this.val(srv.port) });
                                //dataBinder.bind(divOuter, { services: { ip: server.hostname, port: server.port, protocol: server.protocol + '//' } });
                                $.pic.modalDialog.closeDialog(dlg[0]);
                            });
                        }
                    }
                    else {
                        searchStatus.text('No running ' + server.desc + ' servers could be found.');
                    }
                });
            });
            var found = $('<div></div>').appendTo(dlg).addClass('pnl-found-servers');
            var line = $('<div></div>').appendTo(found);
            var searchStatus = $('<div></div>').appendTo(line).css({ padding: '.5rem' }).addClass('status-text').addClass('picSearchStatus').text('Searching for running ' + server.desc + ' servers.');
            line = $('<div></div>').appendTo(found);
            $('<hr></hr>').appendTo(line);
            line = $('<div></div>').css({ textAlign: 'center' }).appendTo(found);
            dlg.css({ overflow: 'visible' });

        },
        _createConnectionDialog: function (id, title, conns) {
            var self = this, o = self.options, el = self.element;
            var dlg = $.pic.modalDialog.createDialog(id, {
                width: '570px',
                height: 'auto',
                title: title,
                buttons: [
                    {
                        id: 'btnFindServer',
                        hidden: true,
                        text: 'Find Server', icon: '<i class="fas fa-binoculars"></i>',
                        click: function (evt) {
                            var itm = dlg.find('div.picPickList[data-bind="type.name"]:first')[0].selectedItem();
                            self._findServer(dlg, { name: itm.name, desc: itm.desc, urn: itm.urn });
                        }
                    },
                    {
                        text: 'Save', icon: '<i class="fas fa-save"></i>',
                        click: function () {
                            if (dataBinder.checkRequired(dlg, true)) {
                                var c = dataBinder.fromElement(dlg);
                                $.putLocalService('/config/connection', c, 'Saving Connection...', function (conn, status, xhr) {
                                    dataBinder.bind(dlg, conn);
                                    dlg.find('div[data-bind="type.name"]')[0].disabled(true);
                                    self._reloadConnections();
                                });
                            }
                        }
                    },
                    {
                        text: 'Cancel', icon: '<i class="far fa-window-close"></i>',
                        click: function () { $.pic.modalDialog.closeDialog(this); }
                    }]
            });
            $('<div></div>').appendTo(dlg)
                .text('Connections are used to define triggers as inputs and calls for outputs.  Only active connections can communicate with the Equipment Manager.');
            $('<hr></hr>').appendTo(dlg);
            var line = $('<div></div>').appendTo(dlg);
            $('<div></div>').appendTo(line).pickList({
                required: true,
                bindColumn: 0, displayColumn: 1, labelText: 'Conn Type', binding: 'type.name',
                columns: [{ hidden: true, binding: 'name', text: 'Name', style: { whiteSpace: 'nowrap' } }, { binding: 'desc', text: 'Type', style: { minWidth: '157px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, { binding: 'inst', text: 'Description', style: { minWidth: '327px' } }],
                items: conns.connectionTypes, inputAttrs: { style: { width: '12rem' } }, labelAttrs: { style: { width: '5.5rem' } }
            }).on('selchanged', function (e) {
                var c = dataBinder.fromElement(dlg);
                c.type = e.newItem;
                dlg.find('div.pnl-connection-type').each(function () { this.dataBind(c); });
            });
            $('<div></div>').appendTo(line).checkbox({ labelText: 'Is Active', binding: 'isActive' });
            line = $('<div></div>').appendTo(dlg);
            $('<input type="hidden"></input>').appendTo(line).attr('data-bind', 'id').attr('data-datatype', 'int');
            $('<div></div>').appendTo(line).inputField({ labelText: 'Name', binding: 'name', inputAttrs: { maxlength: 24 }, labelAttrs: { style: { width: '5.5rem' } } });
            $('<div></div>').appendTo(dlg).pnlConnectionType({ connectionTypes: conns.connectionTypes, connections: conns.connections });
            dlg.css({ overflow: 'visible' });
            return dlg;
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            $('<div></div>').appendTo(el).crudList({
                key: 'id', actions: {canCreate: true, canEdit: true, canRemove:true },
                caption: 'Connections', itemName: 'Connection',
                columns: [{ binding: 'name', text: 'Name', style: { width: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, { binding: 'type.desc', text: 'Type', style: { width: '177px' } }]
            }).on('additem', function (evt) {
                $.getLocalService('/config/options/connections', null, function (conns, status, xhr) {
                    var dlg = self._createConnectionDialog('dlgAddConnection', 'Add a new Connection', conns);
                    dataBinder.bind(dlg, { isActive: true });
                });
            }).on('edititem', function (evt) {
                $.getLocalService('/config/options/connections/' + evt.dataKey, null, function (conns, status, xhr) {
                    var dlg = self._createConnectionDialog('dlgEditConnection', 'Edit a Connection', conns);
                    dataBinder.bind(dlg, conns.connection);
                    dlg.find('div[data-bind="type.name"]')[0].disabled(true);
                    dataBinder.bind(dlg, conns.connection);  // Bind it twice to make sure we have all the data.
                });
            }).on('removeitem', function (evt) {
                $.getLocalService('/config/options/connections/' + evt.dataKey, null, function (conns, status, xhr) {
                    $.pic.modalDialog.createConfirm('dlgConfirmConnection', {
                        message: '<div>Are you sure you want to delete Connection ' + conns.connection.name + '?</div><hr></hr><div><span style="color:red;font-weight:bold;">WARNING:</span> If you delete this connection it will remove all <span style="font-weight:bold;">triggers</span> associated with this connection.</div>',
                        width: '377px',
                        height: 'auto',
                        title: 'Confirm Delete Connection',
                        buttons: [{
                            text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                            click: function () {
                                $.pic.modalDialog.closeDialog(this);
                                $.deleteLocalService('/config/options/connections/' + evt.dataKey, {}, 'Deleting Connection...', function (c, status, xhr) {
                                    evt.dataRow.remove();
                                });
                            }
                        },
                        {
                            text: 'No', icon: '<i class="far fa-window-close"></i>',
                            click: function () { $.pic.modalDialog.closeDialog(this); }
                        }]
                    });
                });
            });
        },
        dataBind: function (conns) {
            var self = this, o = self.options, el = self.element;
            var list = el.find('div.crud-list:first')[0];
            list.clear();
            for (var i = 0; i < conns.length; i++) {
                //console.log(conns[i]);
                list.addRow(conns[i]);
            }
        }
    });
    $.widget('pic.pnlI2cBuses', {
        options: { cfg: {} },
        _create: function () {
            var self = this, o = self.options, el = self.element;
            self._buildControls();
            el[0].dataBind = function (conns) { self.dataBind(conns); }
        },
        _reloadBuses() {
            var self = this, o = self.options, el = self.element;
            $.getLocalService('/config/options/I2c', null, function (i2c, status, xhr) {
                console.log(i2c);
                self.dataBind(i2c.buses);
            });
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            $('<div></div>').appendTo(el).crudList({
                id: 'crudI2cBuses',
                key: 'busNumber', actions: { canCreate: true, canEdit: false, canRemove: true },
                caption: 'I<span style="vertical-align:super;font-size:.7em;display:inline-block;margin-top:-20px;">2</span>C - Buses', itemName: 'Bus',
                columns: [{ binding: 'busNumber', text: '#', style: { width: '2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' } }, { binding: 'detected.path', text: 'Path', style: { width: '177px' } }]
            }).css({ display: 'inline-block' }).on('additem', function (evt) {
                $('<div id="dlgAddI2cBus" style="display:block;position:relative;padding:4px;"></div>').dlgI2cBus();
            }).on('removeitem', function (evt) {
                $.getLocalService('/config/options/i2cBus/' + evt.dataKey, null, function (bus, status, xhr) {
                    $.pic.modalDialog.createConfirm('dlgConfirmI2cBus', {
                        message: '<div>Are you sure you want to delete I<span style="vertical-align:super;font-size:.7em;display:inline-block;margin-top:-20px;">2</span>C - Bus #' + bus.busNumber + '?</div><hr></hr><div><span style="color:red;font-weight:bold;">WARNING:</span> If you delete this bus it will remove all <span style="font-weight:bold;">devices</span> configured on the bus.</div>',
                        width: '377px',
                        height: 'auto',
                        title: 'Confirm Delete I<span style="vertical-align:super;font-size:.7em;display:inline-block;margin-top:-20px;">2</span>C Bus',
                        buttons: [{
                            text: 'Yes', icon: '<i class="fas fa-trash"></i>',
                            click: function () {
                                $.pic.modalDialog.closeDialog(this);
                                $.deleteLocalService('/config/options/connections/' + evt.dataKey, {}, 'Deleting Connection...', function (c, status, xhr) {
                                    evt.dataRow.remove();
                                });
                            }
                        },
                        {
                            text: 'No', icon: '<i class="far fa-window-close"></i>',
                            click: function () { $.pic.modalDialog.closeDialog(this); }
                        }]
                    });
                });
                });
            var line = $('<div></div>').css({ display: 'inline-block', verticalAlign: 'top' }).appendTo(el);
            $('<div></div>').appendTo(line).addClass('script-advanced-instructions').css({ width: '13rem', marginLeft:'.5rem' }).html('Add the I<span style="vertical-align:super;font-size:.7em;display:inline-block;margin-top:-20px;">2</span>C Buses you would like to control by clicking the plus sign.');
        }

    });
    $.widget('pic.pnlConnectionType', {
        options: {},
        _create: function () {
            var self = this, o = self.options, el = self.element;
            el[0].dataBind = function (conn) { self.dataBind(conn); }
            self._buildControls();
        },
        _buildControls: function () {
            var self = this, o = self.options, el = self.element;
            el.addClass('pnl-connection-type');
        },
        _buildUriControls: function (type) {
            var self = this, o = self.options, el = self.element;
            var binding = '';
            var line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).pickList({
                labelText: 'Server', binding: binding + 'protocol', required: true,
                inputAttrs: { maxlength: 5 }, labelAttrs: { style: { width: '5.5rem' } },
                columns: [{ binding: 'val', hidden: true, text: 'Protocol', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Protocol', style: { whiteSpace: 'nowrap', width: '4rem' } }, { binding: 'desc', text: 'Description', style: { minWidth: '300px' } }],
                bindColumn: 0, displayColumn: 1, items: [{ val: 'http:', name: 'http:', desc: 'The Equipment Manager is communicating without an SSL certificate' },
                { val: 'https:', name: 'https:', desc: 'The Equipment Manager is communicating using an SSL certificate.' }]
            });
            $('<div></div>').appendTo(line).inputField({ labelText: '', binding: binding + 'ipAddress', inputAttrs: { maxlength: 20 }, labelAttrs: { style: { width: '0px' } } });
            $('<div></div>').appendTo(line).inputField({ labelText: ':', dataType: 'int', binding: binding + 'port', inputAttrs: { maxlength: 7 }, labelAttrs: { style: { marginLeft: '.15rem', marginRigt: '.15rem' } } });
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'User Name', binding: binding + 'userName', labelAttrs: { style: { width: '5.5rem' } }, inputAttrs: { maxlength: 20 } });
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Password', binding: binding + 'password', labelAttrs: { style: { width: '5.5rem' } }, inputAttrs: { maxlength: 20 } });
            $('<hr></hr').appendTo(el);
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Key File', binding: binding + 'sslKeyFile', labelAttrs: { style: { width: '5.5rem' } }, inputAttrs: { maxlength: 50 } });
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Cert File', binding: binding + 'sslCertFile', labelAttrs: { style: { width: '5.5rem' } }, inputAttrs: { maxlength: 50 } });
        },
        _buildMqttClientControls: function (type) {
            var self = this, o = self.options, el = self.element;
            var binding = '';
            var line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Client Id', binding: binding + 'options.clientId', labelAttrs: { style: { width: '5.5rem' } }, inputAttrs: { maxlength: 20 } });
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).pickList({
                labelText: 'Server', binding: binding + 'protocol', required: true,
                inputAttrs: { maxlength: 5 }, labelAttrs: { style: { width: '5.5rem' } },
                columns: [{ binding: 'val', hidden: true, text: 'Protocol', style: { whiteSpace: 'nowrap' } }, { binding: 'name', text: 'Protocol', style: { whiteSpace: 'nowrap', width: '4rem' } }, { binding: 'desc', text: 'Description', style: { minWidth: '300px' } }],
                bindColumn: 0, displayColumn: 1, items: [{ val: 'mqtt:', name: 'mqtt:', desc: 'Communication with the broker over TCP socket.' },
                { val: 'mqtts:', name: 'mqtts:', desc: 'Communication with the broker over a TLS connection.' }]
            });
            $('<div></div>').appendTo(line).inputField({ labelText: '', binding: binding + 'ipAddress', inputAttrs: { maxlength: 20 }, labelAttrs: { style: { width: '0px' } } });
            $('<div></div>').appendTo(line).inputField({ labelText: ':', dataType: 'int', binding: binding + 'port', inputAttrs: { maxlength: 7 }, labelAttrs: { style: { marginLeft: '.15rem', marginRigt: '.15rem' } } });
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'User Name', binding: binding + 'userName', labelAttrs: { style: { width: '5.5rem' } }, inputAttrs: { maxlength: 20 } });
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Password', binding: binding + 'password', labelAttrs: { style: { width: '5.5rem' } }, inputAttrs: { maxlength: 20 } });
            $('<hr></hr').appendTo(el);
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Key File', binding: binding + 'sslKeyFile', labelAttrs: { style: { width: '5.5rem' } }, inputAttrs: { maxlength: 50 } });
            line = $('<div></div>').appendTo(el);
            $('<div></div>').appendTo(line).inputField({ labelText: 'Cert File', binding: binding + 'sslCertFile', labelAttrs: { style: { width: '5.5rem' } }, inputAttrs: { maxlength: 50 } });
        },
        dataBind: function (conn) {
            var self = this, o = self.options, el = self.element;
            var connType = el.attr('data-conntype');
            console.log(conn);
            if (conn.type.name !== connType) {
                // We need to create the interface for the new connection type.
                el.empty();
                switch (conn.type.name) {
                    case 'njspc':
                    case 'webSocket':
                        self._buildUriControls(conn.type);
                        break;
                    case 'wsEndpoint':
                        break;
                    case 'wsClient':
                        self._buildUriControls(conn.type);
                        break;
                    case 'mqttClient':
                        self._buildMqttClientControls(conn.type);
                        break;
                    case 'mqttBroker':
                        break;
                }
                if (typeof conn.type.urn !== 'undefined' && conn.type.urn) {
                    var btn = el.parents('div.ui-widget-content:first').find('#btnFindServer');
                    btn.attr('data-urn', conn.type.urn);
                    btn.show();
                }
                else
                    el.parents('div.ui-widget-content:first').find('#btnFindServer').hide();
            }
            dataBinder.bind(el, conn);
            el.attr('data-conntype', conn.type);
        }
    });
})(jQuery);
