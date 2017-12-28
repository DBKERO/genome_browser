KERO-browse
====

Simple HTML5 canvas based genome browser for NGS data.
KERO-browse supports several file formats such as bam(+bai) or BigWig.

## Demo

[DBTSS](https://dbtss.hgc.jp/#kero:chr1:99,950,000-100,050,000)

## Requirement

Web browser: Edge (V40 above), Google Chrome (V61 above) or Firefox (V56 above).  
(JavaScript Generator supported web browser required)

## Install
For demo page installation:

    cd /your/open/web_directory/
    git clone https://github.com/DBKERO/genome_browser.git
    
    #change proper file permission like:
    #find ./genome_browser -type d -print | xargs chmod 755
    #find ./genome_browser -type f -print | xargs chmod 644
    #please access demo page: http://your_domain/genome_browser/sample.html

The following browser will be appeared:

![kero_top](http://kero.hgc.jp/images/kero_demo/demo_top.png "kero_top")

Default genome version is UCSC hg38. The chromosome name are chr1, chr2..., chrM (not 1, 2..., Mt)  
If you want to add track with your local PC files (supported only .bam+.bai or .bw), please select files as follows:

![select_local](http://kero.hgc.jp/images/kero_demo/select_local_files.png "select_local")


## Contribution

- This database has been supported by the framework of National Bioscience Database Center (NBDC) of Japan Science and Technology Agency (JST). Grant Number [17934018]
- KERO is financially supported with a Grant-in-Aid for Publication of Scientific Research Results (Databases) by Japan Society for the Promotion of Science, a Grant-in-aid for Scientific Research on Innovative Areas 'Genome Science' [221S0002] from the Ministry of Education, Culture, Sports, Science and Technology of Japan

## Licence

[MIT](https://github.com/tcnksm/tool/blob/master/LICENCE)

## Author

[DBKERO](https://github.com/DBKERO/)

