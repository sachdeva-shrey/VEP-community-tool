import {
  useTable,
  useSortBy,
  usePagination,
  useGlobalFilter,
} from "react-table";
import { useExportData } from "react-table-plugins";
import React, { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import { getExportFileBlob } from "../utils/helpers/exportFile";
import { VariantData } from "../utils/types";
import { ERROR, TABLE_PAGE_SIZE } from "../utils/constants";
import CSVUpload from "./CSVUpload";
import * as Icon from "../assets/icons/index";
import { getPredictions } from "../utils/service";
import Loader from "./Loader";

const RESULT_COLUMN_DATA = [
  {
    Header: "S. No.",
    accessor: "id",
    Cell: function rowSerial(row: any) {
      return <div>{Number(row.row.id) + 1}</div>;
    },
  },
  {
    Header: "Position",
    accessor: "nextprotPosition",
  },
  {
    Header: "Original",
    accessor: "originalAminoAcid",
  },
  {
    Header: "Variant",
    accessor: "variantAminoAcid",
  },
  {
    Header: "Sift",
    accessor: "sift",
  },
  {
    Header: "Polyphen",
    accessor: "polyphen",
  },
];

type TableProps = {
  predictionLoading: boolean;
  setPredictionLoading: (predictionLoading: boolean) => void;
  data: VariantData[];
  setData: (data: VariantData[]) => void;
  error: string | undefined;
  setError: (error: string) => void;
  isoName: string | undefined;
  fv: any;
};

const Table = (props: TableProps) => {
  const {
    predictionLoading,
    setPredictionLoading,
    data,
    setData,
    error,
    setError,
    isoName,
    fv,
  } = props;

  const callGetPredictions = async (csvData: VariantData[]) => {
    const data = {
      isoform: isoName,
      variants: csvData,
    };
    setPredictionLoading(true);
    await getPredictions(data).then((res) => {
      if (res) {
        if (res.length < data.variants.length) setError(ERROR.PARTIAL_RESULTS);
        else setError("");

        setData(res);
        setPredictionLoading(false);
        return;
      }
      setError(ERROR.NO_RESULTS);
      setPredictionLoading(false);
    });
  };

  const columns = useMemo(() => RESULT_COLUMN_DATA, []);

  const getExportFileName = () => {
    return isoName;
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
    exportData,
  } = useTable(
    {
      //@ts-ignore
      columns,
      data,
      getExportFileBlob,
      getExportFileName,
      initialState: { pageIndex: 0, pageSize: TABLE_PAGE_SIZE },
    },
    useGlobalFilter,
    useSortBy,
    useExportData,
    usePagination,
  );

  return (
    <div className="variant-table-container">
      {error && (
        <div className="error-message">
          <img src={Icon.Error} alt="Error" />
          <p>{error}</p>
        </div>
      )}
      <div className="table-header">
        <CSVUpload callGetPredictions={callGetPredictions} />
        <div style={{ marginLeft: "auto" }}>
          <button
            className="btn get-predictions-btn"
            onClick={() => {
              let data = fv.getPredictions();
              callGetPredictions(data);
            }}
          >
            Get Predictions
          </button>
          <button
            className="btn"
            onClick={() => {
              exportData("csv", true);
            }}
          >
            Export All as CSV
          </button>
        </div>
      </div>
      <table {...getTableProps()} className="variant-data-table">
        <thead>
          {headerGroups.map((headerGroup) => {
            return (
              <tr {...headerGroup.getHeaderGroupProps()} key={uuidv4()}>
                {headerGroup.headers.map((column) => {
                  return (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      key={uuidv4()}
                    >
                      {column.render("Header")}
                      <span>
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <img
                              src={Icon.DownArrow}
                              className="icon"
                              alt="Down arrow icon"
                            />
                          ) : (
                            <img
                              src={Icon.UpArrow}
                              className="icon"
                              alt="Down arrow icon"
                            />
                          )
                        ) : (
                          <img
                            src={Icon.Sort}
                            className="icon"
                            alt="Down arrow icon"
                          />
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={uuidv4()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()} key={uuidv4()}>
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {predictionLoading && (
        <>
          <p className="table-text">
            <i>Fetching predictions...</i>
          </p>
          <Loader />
        </>
      )}
      {data.length === 0 && !predictionLoading ? (
        <p className="table-text">
          <i>
            No records added. Add variants and click on get predictions to get
            results
          </i>
          .
        </p>
      ) : (
        <div className="pagination">
          <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
            {"<<"}
          </button>{" "}
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            {"<"}
          </button>{" "}
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            {">"}
          </button>{" "}
          <button
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
          >
            {">>"}
          </button>{" "}
          <span>
            Page{" "}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{" "}
          </span>
          <span>
            | Go to page:{" "}
            <input
              type="number"
              defaultValue={pageIndex + 1 || 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                gotoPage(page);
              }}
            />
          </span>{" "}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Table;
