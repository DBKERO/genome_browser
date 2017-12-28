KERO-browse
====

Simple HTML5 canvas based genome browser for NGS data.
KERO-browse supports several file formats such as bam(+bai) or BigWig.

## Getting Started

### Demo

[DBTSS](https://dbtss.hgc.jp/#kero:chr1:99,950,000-100,050,000)

### Requirement

Web browser: Edge (V40 above), Google Chrome (V61 above) or Firefox (V56 above).  
(JavaScript Generator supported web browser required)

### Installing
For demo page installation:

    cd /your/open/web_directory/
    git clone https://github.com/DBKERO/genome_browser.git
    
    #change proper file permission like:
    #find ./genome_browser -type d -print | xargs chmod 755
    #find ./genome_browser -type f -print | xargs chmod 644
    #please access demo page: http://your_domain/genome_browser/sample.html


## Running the tests

When you access demo page (http://your_domain/genome_browser/sample.html),  
the following browser will be appeared:

![kero_top](http://kero.hgc.jp/images/kero_demo/demo_top.png "kero_top")

Default genome version is UCSC hg38. The chromosome name are chr1, chr2..., chrM (not 1, 2..., Mt)  
If you want to add track with your local PC files (supported only .bam+.bai or .bw), please select files as follows:

![select_local](http://kero.hgc.jp/images/kero_demo/select_local_file.png "select local")

## How to open your data (e.g. BigWig)

### Preparation of hg38 genome sequence and NCBI RefSeq data
- Copy genome and RefSeq truck data

    cd /your/open/web_directory/genome_browser/test_data/
    wget http://kero.hgc.jp/data/hg38/data.dat
    wget http://kero.hgc.jp/data/hg38/genes.sorted.bb
    #chmod if need
    #Access to: http://your_domain/genome_browser/index.html

- Upload your bigWig to server (e.g., /your/open/web_directory/genome_browser/test_data/foo.bw)
- Edit edit_me.js (genome_browser/js/edit_me.js)
- Add following line to edit_me.js around line 10:
   var obigwig2 = new WgBigWig2("obigwig2", "#5555ff", "My bigWig", "test_data/foo.bw");
- Add ", obigwig2" to edit_me.js line 57.

    //Show genome browser
    gvObj.setupGenomeViewer(posStr, 1000, 300, [
        "<hr /><div>Category buttons</div>", 
        "<div><input type=\"button\" id=\"show_item\" value=\"Show public data\" name=\"Sequence|NCBI RefSeq\" /></div>",
        "<hr /><div>Public data</div>", 
        oseq, orefseq, 
        "<hr /><div>Your data</div>", 
        obigwig
    ]);


    //Show genome browser
    gvObj.setupGenomeViewer(posStr, 1000, 300, [
        "<hr /><div>Category buttons</div>", 
        "<div><input type=\"button\" id=\"show_item\" value=\"Show public data\" name=\"Sequence|NCBI RefSeq\" /></div>",
        "<hr /><div>Public data</div>", 
        oseq, orefseq, 
        "<hr /><div>Your data</div>", 
        obigwig, obigwig2
    ]);


## Authors

[DBKERO](https://github.com/DBKERO/)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

