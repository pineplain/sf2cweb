var GRAPH_JSON_STR = '{"cells":[{"type":"basic.Rect","position":{"x":75,"y":110},"size":{"width":150,"height":60},"angle":0,"id":"94c31334-2d2f-4dd8-913b-02447e47ee08","z":1,"attrs":{"rect":{"fill":"blue"},"text":{"text":"うそです","fill":"white"}}},{"type":"basic.Rect","position":{"x":550,"y":115},"size":{"width":150,"height":60},"angle":0,"id":"128b02ae-20a4-4c36-a6bb-4bea248be176","z":2,"attrs":{"rect":{"fill":"blue"},"text":{"text":"たすくですよ","fill":"white"}}},{"type":"link","source":{"id":"94c31334-2d2f-4dd8-913b-02447e47ee08"},"target":{"id":"128b02ae-20a4-4c36-a6bb-4bea248be176"},"id":"6821aafe-64fa-46b9-b145-d8931f22ec02","z":3,"attrs":{".connection":{"stroke-width":3,"stroke":"black"},".marker-target":{"stroke":"black","fill":"black","d":"M 12 0 L 0 6 L 12 12 z"}}},{"type":"basic.Rect","position":{"x":75,"y":345},"size":{"width":150,"height":60},"angle":0,"id":"7c06af00-8dd1-4d66-b3df-18755a02096a","z":4,"attrs":{"rect":{"fill":"blue"},"text":{"text":"タスク２","fill":"white"}}},{"type":"link","source":{"id":"94c31334-2d2f-4dd8-913b-02447e47ee08"},"target":{"id":"7c06af00-8dd1-4d66-b3df-18755a02096a"},"id":"01f843ca-57e3-4ed7-b9f9-db8cb0a6e036","z":5,"attrs":{".connection":{"stroke-width":3,"stroke":"black"},".marker-target":{"stroke":"black","fill":"black","d":"M 12 0 L 0 6 L 12 12 z"}}},{"type":"link","source":{"id":"7c06af00-8dd1-4d66-b3df-18755a02096a"},"target":{"id":"128b02ae-20a4-4c36-a6bb-4bea248be176"},"id":"fb22ff08-b483-43bf-a3bf-a694995ab986","z":6,"attrs":{".connection":{"stroke-width":3,"stroke":"black"},".marker-target":{"stroke":"black","fill":"black","d":"M 12 0 L 0 6 L 12 12 z"}}}]}';
var SF_PROPS_JSON_STR = '{"props":[{"id":"94c31334-2d2f-4dd8-913b-02447e47ee08","type":"node","taskName":"うそです","workload":"あああ","worker":"いい意味で","location":"ううう～","comment":"コメント"},{"id":"128b02ae-20a4-4c36-a6bb-4bea248be176","type":"node","taskName":"たすくですよ","workload":"","worker":"","location":"","comment":"ほげほげ"},{"id":"7c06af00-8dd1-4d66-b3df-18755a02096a","type":"node","taskName":"タスク２","workload":"","worker":"","location":"","comment":"コメントです。"}]}';

var selectedCell = null;

$(function() {
    // graph
    var graph = new joint.dia.Graph;

    // release selected state when removed
    graph.on('remove', function(cell) {
        if (cell === selectedCell) {
            selectedCell = null;
        }
    });

    // paper
    var paper = new joint.dia.Paper({
        el: $('#holder'),
        width: $('#holder').width(),
        height: $('#holder').height(),
        model: graph,
        gridSize: 5,
        snapLinks: true,
        perpendicularLinks: true,
        linkView: joint.dia.LinkView.extend({
            pointerdblclick: function(evt, x, y) {
                if (V(evt.target).hasClass('connection') || V(evt.target).hasClass('connection-wrap')) {
                    this.addVertex({ x: x, y: y });
                }
            }
        }),
        interactive: function(cellView) {
            if (cellView.model instanceof joint.dia.Link) {
                return { vertexAdd: false };
            }
            return true;
        },
    });

    paper.on('blank:pointerclick', function(evt, x, y) {
        if ($('#node_btn').hasClass('active')) {
            // add rect when clicked
            var rect = new joint.shapes.basic.Rect({
                position: { x: x, y: y },
                size: { width: 150, height: 60 },
                attrs: { rect: { fill: 'blue', }, text: { text: 'New task', fill: 'white' } },
            });
            graph.addCell(rect);

            // set default property
            rect.sfProp = {
                id: rect.id,
                type: 'node',
                taskName: 'New task',
                workload: '',
                worker: '',
                location: '',
                comment: '',
            };
        } else if ($('#edge_btn').hasClass('active')) {
            // add link when clicked
            var link = new joint.dia.Link({
                source: { x: x - 100, y: y },
                target: { x: x + 100, y: y },
                attrs: {
                    '.connection': {
                        'stroke-width': 3, stroke: 'black'
                    },
                    '.marker-target': { stroke: 'black', fill: 'black', d: 'M 12 0 L 0 6 L 12 12 z' },
                }
            });
            graph.addCell(link);
        }
    });

    // show property icon when mouseovered
    paper.on('cell:pointerclick', function(cellView, evt, x, y) {
        // change color
        var cell = cellView.model;
        if (isRect(selectedCell)) {
            setCellColor(selectedCell, 'blue');
        } else if (isLink(selectedCell)) {
            setCellColor(selectedCell, 'black');
        }
        if (cell === selectedCell) {
            selectedCell = null;
        } else {
            selectedCell = cell;
            setCellColor(selectedCell, 'red');
        }

        // show properties
        if (isRect(cell)) {
            showSfProps(cell.sfProp);
        } else {
            $('.sf-prop-field').val('');
        }
    });

    // reflect properties modification
    $('.sf-prop-field').change(function() {
        if (isRect(selectedCell)) {
            updateSfProps(selectedCell);
            selectedCell.attr({
                text: { text: selectedCell.sfProp.taskName },
            });
        }
    });

    // remove cell when remove button clicked
    $('#remove_btn').click(function() {
        if (selectedCell !== null) {
            selectedCell.remove();
            selectedCell = null;
        }
    });

    // clear graph when clear button clicked
    $('#clear_btn').click(function() {
        graph.clear();
        selectedCell = null;
    });

    // file import
    $('#import_btn').click(function() {
        // $('#import_file').click();
        graph.fromJSON(JSON.parse(GRAPH_JSON_STR));
        importSfPropFromJSON(graph, JSON.parse(SF_PROPS_JSON_STR));
    });
    $('#import_file').change(function() {
        var file = $(this)[0].files[0];
        console.log(file);
    });

    // file export
    $('#export_btn').click(function() {
        if (isRect(selectedCell)) {
            setCellColor(selectedCell, 'blue');
        } else if (isLink(selectedCell)) {
            setCellColor(selectedCell, 'black');
        }
        selectedCell = null;

        var sfPropAry = $.map(graph.getElements(), function(val, idx) {
            return val.sfProp;
        });
        console.log(JSON.stringify(graph.toJSON()));
        console.log(JSON.stringify({ props: sfPropAry }));
    });

    // resize paper object
    $(window).resize(function() {
        paper.setDimensions($('#holder').width(), $('#holder').height());
    });

    // tooltip
    $('[data-toggle="tooltip"]').tooltip();
});

var isRect = function(cell) {
    return ((selectedCell !== null) && (cell instanceof joint.shapes.basic.Rect));
};

var isLink = function(cell) {
    return ((selectedCell !== null) && (cell instanceof joint.dia.Link));
};

var setCellColor = function(cell, color) {
    if (isRect(cell)) {
        cell.attr({
            rect: { fill: color },
        });
    } else if (isLink(cell)) {
        cell.attr({
            '.connection': { stroke: color },
            '.marker-target': { stroke: color, fill: color },
        });
    }
};

var showSfProps = function(prop) {
    $('#task_name').val(prop.taskName);
    $('#workload').val(prop.workload);
    $('#worker').val(prop.worker);
    $('#location').val(prop.location);
    $('#comment').val(prop.comment);
};

var updateSfProps = function(cell) {
    cell.sfProp = {
        id: cell.id,
        type: cell.sfProp.type,
        taskName: $('#task_name').val(),
        workload: $('#workload').val(),
        worker: $('#worker').val(),
        location: $('#location').val(),
        comment: $('#comment').val(),
    };
};

var importSfPropFromJSON = function(graph, json) {
    $.each(graph.getElements(), function(i, node) {
        var prop = json.props.filter(function(prop, j) {
            if (node.id === prop.id) {
                return prop;
            }
        })[0];
        node.sfProp = prop;
    });
};
