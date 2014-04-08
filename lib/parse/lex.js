var _ = require('lodash');
var marked = require('marked');

// Split a page up into sections (lesson, exercises, ...)
function splitSections(nodes) {
    var section = [];

    return _.reduce(nodes, function(sections, el) {
        if(el.type === 'hr') {
            sections.push(section);
            section = [];
        } else {
            section.push(el);
        }

        return sections;
    }, []).concat([section]); // Add remaining nodes
}

var classHtmlAttribute = /class=['"](.+)['"]/;

// What is the type of this section
function sectionType(nodes, idx) {
    var codeNodes = _.filter(nodes, {
        type: 'code'
    }).length;

    if(
        (codeNodes === 3 || codeNodes === 4) &&
        (idx % 2) === 1)
    {
        return 'exercise';
    }

    if (nodes.length > 2) {
        var nonBlockquoteNodes = nodes.slice(nodes[0].type === 'paragraph' ? 1 : 0);
        nonBlockquoteNodes.splice(_.findIndex(nonBlockquoteNodes, { type: 'blockquote_start' }),
                                  _.findIndex(nonBlockquoteNodes, { type: 'blockquote_end' }));

        if (nonBlockquoteNodes.length === 2) {
            if (_.every(nonBlockquoteNodes, { type: 'table' })) {
                if (_.every(nonBlockquoteNodes[0].cells, function(row) {
                  return _.every(row.slice(1), function(cell) { return cell === "( )"; });
                })) {
                  return 'quiz';
                }
            }
        }
    }

    var revealNodes = _.filter(nodes, function(n) {
        var text = n.text.substring(0, n.text.indexOf(">")),
            classAttr = classHtmlAttribute.exec(text);
        return n.type === 'html' && classAttr && classAttr[1] === 'reveal';
    });

    _.each(revealNodes, function(n) {
        var body = n.text.substring(n.text.indexOf('>') + 1, n.text.lastIndexOf('<'));
        n.bodyNodes = marked.lexer(body);
    });

    if (revealNodes.length > 0) {
        return 'reveal';
    }

    return 'normal';
}

// Generate a uniqueId to identify this section in our code
function sectionId(section, idx) {
    return _.uniqueId('gitbook_');
}

function lexPage(src) {
    // Lex file
    var nodes = marked.lexer(src);

    return _.chain(splitSections(nodes))
    .map(function(section, idx) {
        // Detect section type
        section.type = sectionType(section, idx);
        return section;
    })
    .map(function(section, idx) {
        // Give each section an ID
        section.id = sectionId(section, idx);
        return section;

    })
    .filter(function(section) {
        return !_.isEmpty(section);
    })
    .reduce(function(sections, section) {
        var last = _.last(sections);

        // Merge normal sections together
        if(last && last.type === section.type && last.type === 'normal') {
            last.push.apply(last, [{'type': 'hr'}].concat(section));
        } else {
            // Add to list of sections
            sections.push(section);
        }

        return sections;
    }, [])
    .value();
}

// Exports
module.exports = lexPage;
